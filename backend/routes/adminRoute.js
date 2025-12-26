const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");

router.post("/admin/schedule_meetings/:complaint_id/:admin_id",admin.schedule_meeting);
router.get("/admin/get_schedule_meetings/:admin_id",admin.get_schedule_meetings); // admin id

router.get("/admin/get_complaints",admin.get_complaints);
router.get("/admin/getAllStudentsCounts",admin.getAllStudentsCounts);
router.get("/admin/getStudentProfile/:student_name/:student_reg_num", admin.getStudentProfile);
router.get("/admin/getStudents",admin.getStudents);
router.get("/admin/get_rejected_complaints",admin.get_rejected_complaints);
router.post("/admin/post_attendance",admin.post_attendance);
router.post("/admin/post_accept_or_resolve",admin.post_acceptorresolve);    



router.get("/admin/get_complaints_summary",admin.get_complaints_summary);
module.exports = router