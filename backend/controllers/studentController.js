const createError = require("http-errors");
const db = require("../config/db");

// Get all complaints for a student + revoke_status
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
        u.name   AS faculty_name,
        u.emailid AS faculty_emailid
      FROM faculty_logger fl
      LEFT JOIN users u
        ON fl.faculty_id = u.user_id
      WHERE fl.student_id = ?
        AND fl.date_time BETWEEN NOW() - INTERVAL 12 HOUR AND NOW() ORDER BY date_time ASC
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


// submit a response for the complaint (accept or revoke)
exports.action_complaint = (req,res,next) => {
  try{
    const { complaint_id } = req.params;
    const { action, reason } = req.body;
    
    if (!complaint_id || !action || String(complaint_id).trim() === "")
      return next(createError.BadRequest("complaint_id and action are required!"));
      
    if (action === 'revoke' && (!reason || reason.trim() === ""))
      return next(createError.BadRequest("reason is required for revoke action!"));

    const sql = `
      UPDATE faculty_logger 
      SET revoke_message = ?, status = ?
      WHERE complaint_id = ?
    `;

    const revoke_message = action === 'accept' ? "null": reason;
    const status = action === 'accept' ? 'accepted' : 'rejected';
    
    db.query(sql, [revoke_message, status, complaint_id], (err, result) => {
      if(err) return next(err);
      if(result.affectedRows == 0) return next(createError.BadRequest('error occurred while updating!'));
      return res.json({ 
        success: true, 
        message: action === 'accept' ? 'Complaint accepted!' : 'Complaint revoked successfully!'
      });
    })
  }
  catch(error){
    next(error);
  }
}



//get Get all complaints for a student
exports.get_complaints_history = (req,res,next) => {
    try{
      const {student_id} = req.params;
      if(!student_id || String(student_id).trim() === "") return next(createError("id not present!"));
      let sql =`
      SELECT 
        fl.*,
        DATE_FORMAT(fl.date_time, '%Y-%m-%d') AS complaint_date,
        DATE_FORMAT(fl.date_time, '%H:%i:%s') AS complaint_time,
        u.name   AS faculty_name,
        u.emailid AS faculty_emailid
      FROM faculty_logger fl
      LEFT JOIN users u
        ON fl.faculty_id = u.user_id
      WHERE fl.student_id = ? and date_time < now() - interval 6 hour ORDER BY date_time DESC`;
      db.query(sql,[student_id],(err,result) => {
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
    const { student_id } = req.params;
    if (!student_id) return next(createError.BadRequest("Student ID is required"));

    // first query: user details
    const userSql = `SELECT name, emailid, reg_num, department, year 
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
      WHERE student_id = ?`;

    db.query(userSql, [student_id], (err, userResult) => {
      if (err) return next(err);
      if (userResult.length === 0) return next(createError.NotFound("User not found"));

      db.query(countSql, [student_id], (err2, countResult) => {
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




// /student/get_schedule_meetings/:student_id
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
        a.user_id         AS admin_id,
        a.name            AS admin_name,
        a.emailId         AS admin_email,
        a.department      AS admin_department,
        f.user_id         AS faculty_id,
        f.name            AS faculty_name,
        f.emailId         AS faculty_email,
        f.department      AS faculty_department
      FROM meetings m
      JOIN faculty_logger fl 
        ON fl.complaint_id = m.complaint_id
      JOIN users a 
        ON a.user_id = m.admin_id
      JOIN users f 
        ON f.user_id = fl.faculty_id
      WHERE fl.student_id = ?
      ORDER BY m.date_time DESC
    `;
    db.query(sql, [req.params.student_id], (err, result) => {
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



