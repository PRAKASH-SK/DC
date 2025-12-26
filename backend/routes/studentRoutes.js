const express = require("express");
const router = express.Router();
const student = require("../controllers/studentController");

router.get("/student/get_complaints/:id",student.get_complaints); // can be also used to display revoke status
router.patch("/student/action_complaint/:complaint_id/:student_id",student.action_complaint); 
router.get("/student/get_complaints_history/:student_id",student.get_complaints_history); 
router.get("/student/get_schedule_meetings/:student_id",student.get_schedule_meetings); 
router.get("/student/profile/:student_id",student.profile); 



module.exports = router;