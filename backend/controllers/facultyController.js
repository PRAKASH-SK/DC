const db = require("../config/db");
const createError = require("http-errors");
const Tesseract = require("tesseract.js");
const { complaint_id: generateComplaintId } = require("../utils/id_generation");


exports.get_complaints = (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || String(id).trim() === "")
      return next(createError("id not present!"));

    const sql = `
      SELECT 
        fl.*,
        DATE_FORMAT(fl.date_time, '%Y-%m-%d') AS complaint_date,
        DATE_FORMAT(fl.date_time, '%H:%i:%s') AS complaint_time,
        u.name   AS student_name,
        u.reg_num AS student_reg_num,
         u.emailid AS student_emailid
      FROM faculty_logger fl
      LEFT JOIN users u
        ON fl.student_id = u.user_id
      WHERE fl.faculty_id = ?
        AND fl.date_time BETWEEN NOW() - INTERVAL 6 HOUR AND NOW() ORDER BY date_time DESC
    `;

    db.query(sql, [id], (err, result) => {
      if (err) return next(err);
      if (result.length === 0)
        return res.json({ success: true, message: "No records found", data: [] });

      res.json({ success: true, data: result });
    });
  } catch (error) {
    next(error);
  }
};

exports.get_complaints_history = (req,res,next) => {
    try{
      const {faculty_id} = req.params;
      if(!faculty_id || String(faculty_id).trim() === "") return next(createError("id not present!"));
      let sql =`
      SELECT 
        fl.*,
        DATE_FORMAT(fl.date_time, '%Y-%m-%d') AS complaint_date,
        DATE_FORMAT(fl.date_time, '%H:%i:%s') AS complaint_time,
        u.name   AS student_name,
        u.reg_num AS student_reg_num,
         u.emailid AS student_emailid
      FROM faculty_logger fl
      LEFT JOIN users u
        ON fl.student_id = u.user_id
      WHERE fl.faculty_id = ? 
      and date_time < now() - interval 6 hour ORDER BY date_time DESC`;
      db.query(sql,[faculty_id],(err,result) => {
        console.log("hai");
        if(err)return next(err);
        if(result.length === 0) return res.json({ success: true, message: "No records found", data: []});
        res.json({ success: true, data: result });
      })
    }
    catch(error){
        next(error);
    }
}

exports.profile = async (req, res, next) => {
  try {
    const { faculty_id } = req.params;
    if (!faculty_id) return next(createError.BadRequest("Student ID is required"));

    // first query: user details
    const userSql = `SELECT name, emailid, department,reg_num
                     FROM users 
                     WHERE user_id = ?`;

    // second query: counts by status from faculty_logger
    const countSql = `
      SELECT 
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM faculty_logger 
      WHERE faculty_id = ?`;

    db.query(userSql, [faculty_id], (err, userResult) => {
      if (err) return next(err);
      if (userResult.length === 0) return next(createError.NotFound("User not found"));

      db.query(countSql, [faculty_id], (err2, countResult) => {
        if (err2) return next(err2);

        res.json({
          success: true,
          user: userResult[0],
          counts: {
            accepted_count: countResult[0].accepted_count || 0,
            rejected_count: countResult[0].rejected_count || 0,
            resolved_count: countResult[0].resolved_count || 0,
            pending_count: countResult[0].pending_count || 0
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.createComplaint = async (req, res) => {
  const { student_name, reg_num, venue, complaint, date_time, faculty_id } = req.body;
  // console.log(req.body);
  if (!student_name || !reg_num || !venue || !complaint || !date_time || !faculty_id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query(
    'SELECT user_id FROM users WHERE reg_num = ? AND name = ?',
    [reg_num, student_name],
    async (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0)
        return res.status(404).json({ message: 'Student not found' });

      const student_id = result[0].user_id;
      console.log("Student ID:", student_id); // Debug log

      try {
        const newComplaintId = await generateComplaintId(); // ✅ fixed
        console.log("Generated Complaint ID:", newComplaintId); // Debug log

        db.query(
          'INSERT INTO faculty_logger (complaint_id, student_id, faculty_id, complaint, venue, date_time) VALUES (?,?,?,?,?,?)',
          [newComplaintId, student_id, faculty_id, complaint, venue, date_time],
          (err2) => {
            if (err2){ console.log(err2); return res.status(500).json({ message: err2.message })};
            res.status(201).json({
              message: 'Complaint registered successfully',
              complaint_id: newComplaintId,
            });
          }
        );
      } catch (idErr) {
        return res.status(500).json({ message: idErr.message });
      }
    }
  );
};

exports.getStudents = (req, res, next) => {
  try {
    const sql = `SELECT name, reg_num FROM users WHERE role_id = 1 ORDER BY name ASC`;

    db.query(sql, (err, results) => {
      if (err) return next(err);

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No users found with role_id = 1",
          data: [],
        });
      }
      console.log(results);

      res.status(200).json({
        success: true,
        data: results,
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.getComplaintById = async (req, res) => {
  const { complaint_id } = req.params;
  
  if (!complaint_id) {
    return res.status(400).json({ message: "Complaint ID is required" });
  }

  db.query(
    `SELECT 
      fl.complaint_id,
      fl.complaint,
      fl.venue,
      fl.date_time,
      u.name as student_name,
      u.reg_num
    FROM faculty_logger fl
    JOIN users u ON fl.student_id = u.user_id
    WHERE fl.complaint_id = ?`,
    [complaint_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0) {
        return res.status(404).json({ message: 'Complaint not found' });
      }
      
      res.status(200).json({
        success: true,
        data: result[0]
      });
    }
  );
};

exports.updateComplaint = async (req, res) => {
  const { complaintId } = req.params;
  const { student_name, reg_num, venue, complaint, date_time, faculty_id } = req.body;
  console.log(req.params, req.body);
  
  if (!complaintId || !student_name || !reg_num || !venue || !complaint || !date_time || !faculty_id) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // First verify the student exists
  db.query(
    'SELECT user_id FROM users WHERE reg_num = ? AND name = ?',
    [reg_num, student_name],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const student_id = result[0].user_id;

      // Update the complaint
      db.query(
        `UPDATE faculty_logger 
         SET student_id = ?, complaint = ?, venue = ?, date_time = ?
         WHERE complaint_id = ? AND faculty_id = ?`,
        [student_id, complaint, venue, date_time, complaintId, faculty_id],
        (err2, updateResult) => {
          if (err2) return res.status(500).json({ message: err2.message });
          
          if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Complaint not found or unauthorized' });
          }
          
          res.status(200).json({
            success: true,
            message: 'Complaint updated successfully',
            complaint_id: complaintId
          });
        }
      );
    }
  );
};


// /faculty/get_schedule_meetings/:faculty_id
exports.get_schedule_meetings = (req, res, next) => {
  try {
    const sql = `
      SELECT 
        m.meeting_id,
        m.complaint_id,
        m.admin_id,
        m.venue           AS meeting_venue,
        m.date_time       AS meeting_date_time,
        m.info,
        m.attendance,
        fl.venue          AS fl_venue,
        fl.date_time      AS fl_date_time,
        fl.complaint      AS fl_complaint,
        fl.status         AS fl_status,
        fl.meeting_alloted,
        fl.revoke_message,
        s.user_id         AS student_id,
        s.name            AS student_name,
        s.emailId         AS student_email,
        s.reg_num         AS student_reg_num,
        s.department      AS student_department,
        s.year            AS student_year,
        a.user_id         AS admin_id,
        a.name            AS admin_name,
        a.emailId         AS admin_email,
        a.department      AS admin_department
      FROM meetings m
      JOIN faculty_logger fl 
        ON fl.complaint_id = m.complaint_id
      JOIN users s 
        ON s.user_id = fl.student_id
      JOIN users a 
        ON a.user_id = m.admin_id
      WHERE fl.faculty_id = ?
      ORDER BY m.date_time DESC
    `;
    db.query(sql, [req.params.faculty_id], (err, result) => {
      if (err) return next(err);
      if (result.length === 0) {
        return res.json({ success: true, message: "No meetings found", data: [] });
      }
      return res.json({ success: true, data: result });
    });
  } catch (error) {
    next(error);
  }
};

exports.resolve_complaint = (req, res, next) => {
  try {
    const { complaint_id } = req.params;
    if (!complaint_id || String(complaint_id).trim() === "")
      return next(createError.BadRequest("complaint_id is required!"));

    const sql = "UPDATE faculty_logger SET status = 'resolved' WHERE complaint_id = ?";
    db.query(sql, [complaint_id], (err, result) => {
      if (err) return next(err);
      if (result.affectedRows === 0)
        return next(createError.NotFound("Complaint not found or already resolved"));

      res.json({ success: true, message: "Complaint marked as resolved" });
    });
  } catch (error) {
    next(error);
  }
};



// // update rovoke request status
// exports.update_revoke_status = (req, res, next) => {
//   try {
//     const{status, complaint_id} = req.params;
//     if(!['accepted','rejected'].includes(status) || complaint_id.trim() == "")return next(createError.BadRequest("some parameters are missing!"));
//     let sql = "update faculty_logger set status = ? where complaint_id = ?";
//     db.query(sql,[status, complaint_id], (err,result) => {
//       if(err)return next(err);
//       if(result.affectedRows == 0)return next(createError.BadRequest('status not updated!'));
//       res.send(`status updated to ${status}`);
//     })
//   } catch (error) {
//     next(error);
//   }
// };




// // forwards serious complaints to admin
// exports.send_to_admin = (req, res, next) => {
//   try {
//     const { complaint_id } = req.params;
//     if (!complaint_id || complaint_id.trim() === "")
//       return next(createError.BadRequest("complaint_id is required"));

//     db.beginTransaction(err => {
//       if (err) return next(err);

//       // Insert into faculty_to_admin_issues
//       const sql = `INSERT INTO faculty_to_admin_issues(complaint_id, date_time) VALUES(?, NOW())`;
//       db.query(sql, [complaint_id], (err, result) => {
//         if (err || result.affectedRows === 0) {
//           return db.rollback(() => {
//             next(err || createError.BadRequest("Failed to forward complaint"));
//           });
//         }

//         // Update faculty_logger status
//         const updateSql = `UPDATE faculty_logger SET status = ? WHERE complaint_id = ?`;
//         db.query(updateSql, ['forwarded', complaint_id], (err, result) => {
//           if (err || result.affectedRows === 0) {
//             return db.rollback(() => {
//               next(err || createError.BadRequest("Failed to update status"));
//             });
//           }

//           // Commit transaction
//           db.commit(err => {
//             if (err) {
//               return db.rollback(() => next(err));
//             }
//             res.json({ message: "Complaint forwarded to admin" });
//           });
//         });
//       });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// posts complaint
// exports.post_complaint = async(req,res,next) => {
//   try{
//     const{faculty_id} = req.params;
//     const{complaint, venue} = req.body;
//     if(!req.file)return next(createError.BadRequest('file not found!'));
//     if(!complaint || !venue)return next(createError.BadRequest("complaint description or venue not found!"));
//     // ocr
//     const result = await Tesseract.recognize(req.file.path, 'eng', {
//       logger: info => console.log(info) // ocr process logging
//     });

//     const rawText = result.data.text;
//     // Regex extraction
//     const nameMatch = rawText.match(/^[A-Z\s]+$/m);
//     const regMatch = rawText.match(/\d{7}[A-Z]{2}\d{3}/);
//     const deptMatch = rawText.match(/CSE|ECE|EEE|MECH|FD|FT|CB|AD|AL|BT|ISE|AG|EIE|CE/);

//     const extractedData = {
//       name: nameMatch ? nameMatch[0] : null,
//       register_number: regMatch ? regMatch[0] : null,
//       dept: deptMatch ? deptMatch[0] : null
//     };

//     if(!extractedData.register_number || extractedData.register_number.trim().length < 12) {
//       return res.status(404).json({
//           message: "Retake photo, image was not clear!"
//       });
//     }

//     db.beginTransaction(err => {
//       // fetch student details using his register number
//       let sql = "select * from users where reg_num = ?";
//       db.query(sql,[extractedData.register_number],async(err,user) => {
//         if(err || user.length == 0){
//           return db.rollback(() => {
//             next(err || next(createError.NotFound("User not found!")))
//           })
//         }
//         // insert complaint into faculty logger page
//         const comp_id = await complaint_id();
//         sql = "insert into faculty_logger(complaint_id, student_id, complaint, venue, faculty_id) values(?, ?, ?, ?, ?)";
//         const values = [comp_id, user[0].user_id, complaint, venue, faculty_id];
//         db.query(sql,values,(err1,result) => {
//           if((err) || result.affectedRows == 0){
//             return db.rollback(()=>{
//               next(err1 || createError.BadRequest("An error occured while registering the complaint!"))
//             })
//           }
//            db.commit(err => {
//             if (err) {
//               return db.rollback(() => next(err));
//             }
//             res.send('Complaint registered successfully!');
//           });
          
//         })
//     }) 
//     })

//   }
//   catch(error){
//     next(error);
//   }
// }



