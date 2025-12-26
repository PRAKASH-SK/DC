// const db = require("../config/db");
// const createError = require("http-errors");
// const { meeting_id } = require("../utils/id_generation");

// exports.schedule_meeting = async (req, res, next) => {
//   try {
//     const { complaint_id, admin_id } = req.params;
//     const { venue, info, date_time, faculty_id, student_id } = req.body;
//     console.log(req.body,req.params);

//     const meet_id = await meeting_id();
//     if (
//       !complaint_id?.trim() ||
//       !admin_id?.trim() ||
//       !venue?.trim() ||
//       !info?.trim() ||
//       !date_time?.trim() ||
//       !meet_id?.trim() ||
//       !faculty_id ||
//       !student_id
//     ) {
//       return next(createError.BadRequest("Request body is missing"));
//     }

//     // First insert meeting
//     const insertSql = `
//       INSERT INTO meetings(meeting_id, complaint_id, admin_id, venue, date_time, info, faculty_id, student_id) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;
//     const values = [meet_id, complaint_id, admin_id, venue, date_time, info, faculty_id, student_id];

//     db.query(insertSql, values, (err, result) => {
//       if (err) return next(err);
//       if (result.affectedRows === 0) return next(createError(400));

//       // Now update the faculty_logger table (or whichever table has complaint_id)
//       const updateSql = `UPDATE faculty_logger SET meeting_alloted = 'yes' WHERE complaint_id = ?`;

//       db.query(updateSql, [complaint_id], (err2, updateResult) => {
//         if (err2) return next(err2);

//         return res.json({
//           success: true,
//           message: "Meeting scheduled and complaint updated successfully",
//           meeting_id: meet_id,
//           updatedRows: updateResult.affectedRows
//         });
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// //get meeting details

// exports.get_schedule_meetings = (req, res, next) => {
//   try {
//     const sql = `
//       SELECT 
//         m.meeting_id,
//         m.complaint_id,
//         m.admin_id,
//         m.venue           AS meeting_venue,
//         m.date_time       AS meeting_date_time,
//         m.info,
//         m.attendance,
//         fl.venue          AS fl_venue,
//         fl.date_time      AS fl_date_time,
//         fl.complaint      AS fl_complaint,
//         fl.status         AS fl_status,
//         fl.meeting_alloted,
//         fl.revoke_message,
//         s.user_id         AS student_id,
//         s.name            AS student_name,
//         s.emailId         AS student_email,
//         s.reg_num         AS student_reg_num,
//         s.department      AS student_department,
//         s.year            AS student_year,
//         f.user_id         AS faculty_id,
//         f.name            AS faculty_name,
//         f.emailId         AS faculty_email,
//         f.department      AS faculty_department
//       FROM meetings m
//       JOIN faculty_logger fl 
//         ON fl.complaint_id = m.complaint_id
//       JOIN users s 
//         ON s.user_id = fl.student_id
//       JOIN users f 
//         ON f.user_id = fl.faculty_id
//       WHERE m.admin_id = ?
//       ORDER BY m.date_time DESC
//     `;

//     db.query(sql, [req.params.admin_id], (err, result) => {
//       if (err) return next(err);
//       if (result.length === 0) {
//         return res.json({ success: true, message: "No meetings found", data: [] });
//       }
//       return res.json({ success: true, data: result });
//     });
//   } catch (error) {
//     next(error);
//   }
// };



// //show complients to the admin

// exports.get_complaints = (req, res, next) => {
//   try {
//     const sql = `SELECT 
//     fl.student_id,
//     fl.complaint_id,
//     fl.faculty_id,
//     fl.date_time,
//     fl.venue,
//     fl.complaint,
//     fl.status,
//     fl.revoke_message,
//     fl.meeting_alloted,
    
//     -- student info
//     s.name AS student_name,
//     s.reg_num AS student_reg_num,
//     s.emailId AS student_email,
//     s.department AS student_department,
//     s.year AS student_year,
    
//     -- faculty info
//     f.name AS faculty_name,
//     f.emailId AS faculty_email,
//     f.department AS faculty_department

// FROM faculty_logger fl
// -- join users table for student info
// LEFT JOIN users s ON s.user_id = fl.student_id
// -- join users table for faculty info
// LEFT JOIN users f ON f.user_id = fl.faculty_id

// ORDER BY fl.date_time DESC;
// `;

//     db.query(sql, (err, result) => {
//       if (err) return next(err);

//       if (!result || result.length === 0) {
//         return res.json({
//           success: true,
//           message: "No complaints found",
//           data: []
//         });
//       }

//       return res.json({ success: true, data: result });
      
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// // Get total counts for all students
// exports.getAllStudentsCounts = async (req, res, next) => {
//   try {
//     const countSql = `
//       SELECT 
//         SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
//         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
//         SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
//         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
//       FROM faculty_logger`;

//     db.query(countSql, (err, countResult) => {
//       if (err) return next(err);
//       // 
//       console.log(err);

//       res.json({
//         success: true,
//         type: 'all_students',
//         counts: {
//           accepted_count: countResult[0].accepted_count || 0,
//           rejected_count: countResult[0].rejected_count || 0,
//           resolved_count: countResult[0].resolved_count || 0,
//           pending_count: countResult[0].pending_count || 0
//         }
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Get counts for a specific student
// exports.getStudentProfile = async (req, res, next) => {
//   try {
//     const { student_name, student_reg_num } = req.params;

//     if (!student_name || !student_reg_num) {
//       return next(createError.BadRequest("Student name and reg_num are required"));
//     }

//     // Step 1: find the user_id based on name & reg_num
//     const findUserSql = `SELECT user_id FROM users WHERE name = ? AND reg_num = ? LIMIT 1`;

//     db.query(findUserSql, [student_name, student_reg_num], (err, userResult) => {
//       if (err) return next(err);
//       if (userResult.length === 0) {
//         return res.json({
//           success: false,
//           message: "No student found with provided name and reg_num"
//         });
//       }

//       const student_id = userResult[0].user_id;

//       // Step 2: fetch the counts from faculty_logger
//       const countSql = `
//         SELECT 
//           SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
//           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
//           SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
//           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
//         FROM faculty_logger 
//         WHERE student_id = ?`;

//       db.query(countSql, [student_id], (err2, countResult) => {
//         if (err2) return next(err2);

//         const accepted = countResult[0].accepted_count || 0;
//         const rejected = countResult[0].rejected_count || 0;
//         const resolved = countResult[0].resolved_count || 0;
//         const pending = countResult[0].pending_count || 0;

//         const totalRecords = accepted + rejected + resolved + pending;

//         if (totalRecords === 0) {
//           return res.json({
//             success: true,
//             type: 'specific_student',
//             student_id: student_id,
//             message: 'No records found for this student',
//             counts: {
//               accepted_count: 0,
//               rejected_count: 0,
//               resolved_count: 0,
//               pending_count: 0
//             }
//           });
//         }

//         res.json({
//           success: true,
//           type: 'specific_student',
//           student_id: student_id,
//           counts: {
//             accepted_count: accepted,
//             rejected_count: rejected,
//             resolved_count: resolved,
//             pending_count: pending
//           }
//         });
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //Get students list for admin to search

// exports.getStudents = (req, res, next) => {
//   try {
//     const sql = `SELECT name, reg_num FROM users WHERE role_id = 1 ORDER BY name ASC`;

//     db.query(sql, (err, results) => {
//       if (err) return next(err);

//       if (results.length === 0) {
//         return res.status(200).json({
//           success: true,
//           message: "No users found with role_id = 1",
//           data: [],
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: results,
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// //get rejected complaints in for admin to shedule meeting

// exports.get_rejected_complaints = (req, res, next) => {
//   try {
//     const sql = `SELECT 
//     fl.student_id,
//     fl.complaint_id,
//     fl.faculty_id,
//     fl.date_time,
//     fl.venue,
//     fl.complaint,
//     fl.status,
//     fl.meeting_alloted,
//     fl.revoke_message,
    
//     -- student info
//     s.name AS student_name,
//     s.reg_num AS student_reg_num,
//     s.emailId AS student_email,
//     s.department AS student_department,
//     s.year AS student_year,
    
//     -- faculty info
//     f.name AS faculty_name,
//     f.emailId AS faculty_email,
//     f.department AS faculty_department

// FROM faculty_logger fl
// -- join users table for student info
// LEFT JOIN users s ON s.user_id = fl.student_id
// -- join users table for faculty info
// LEFT JOIN users f ON f.user_id = fl.faculty_id

// WHERE fl.status = 'rejected'  ORDER BY fl.date_time DESC;
// `;

//     db.query(sql, (err, result) => {
//       if (err) return next(err);

//       if (!result || result.length === 0) {
//         return res.json({
//           success: true,
//           message: "No complaints found",
//           data: []
//         });
//       }

//       return res.json({ success: true, data: result });
      
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.getMeetingAlloted = (req, res, next) => {
//   const { complaintId } = req.params;

//   const sql = `
//     SELECT *
//     FROM meeting_alloted
//     WHERE complaint_id = ?
// `;

//   db.query(sql, [complaintId], (err, results) => {
//     if (err) {
//       console.error('Error fetching meeting_alloted:', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No meetings found for this complaint_id' });
//     }

//     res.status(200).json(results);
//   });
// };



// //get total number of complaints,pending complaints and resolved compalaints


// exports.post_attendance = (req, res, next) => {
//   try {
//     const { meeting_id, attendance } = req.body;
    
//     if (!meeting_id || !attendance) {
//       return next(createError.BadRequest("meeting_id and attendance are required"));
//     }

//     const sql = `UPDATE meetings SET attendance = ? WHERE meeting_id = ?`;

//     db.query(sql, [attendance, meeting_id], (err, result) => {
//       if (err) return next(err);
//       if (result.affectedRows === 0) {
//         return next(createError.NotFound("Meeting not found"));
//       }

//       return res.json({
//         success: true,
//         message: "Attendance updated successfully"
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.get_complaints_summary = (req, res, next) => {
//   try {
//     const sql = `
//       SELECT 
//         COUNT(*) AS total_complaints,
//         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_complaints,
//         SUM(CASE WHEN status IN ('accepted', 'rejected') THEN 1 ELSE 0 END) AS resolved_complaints
//       FROM faculty_logger;
//     `;

//     db.query(sql, (err, result) => {
//       if (err) return next(err);

//       if (!result || result.length === 0) {
//         return res.json({
//           success: true,
//           message: "No complaints found",
//           data: { total: 0, pending: 0, resolved: 0 }
//         });
//       }

//       const summary = {
//         total: result[0].total_complaints,
//         pending: result[0].pending_complaints,
//         resolved: result[0].resolved_complaints
//       };

//       return res.json({ success: true, data: summary });
//     });
//   } catch (error) {
//     next(error);
//   }
// };