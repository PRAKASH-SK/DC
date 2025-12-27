const express = require("express");
const router = express.Router();
const admin = require("../controllers/adminController");
const userAuth = require("../middlewares/userAuth");

router.post("/admin/schedule_meetings/:complaint_id/:admin_id",userAuth,admin.schedule_meeting);
router.get("/admin/get_schedule_meetings/:admin_id",userAuth,admin.get_schedule_meetings); // admin id

router.get("/admin/get_complaints",userAuth,admin.get_complaints);
router.get("/admin/getAllStudentsCounts",userAuth,admin.getAllStudentsCounts);
router.get("/admin/getStudentProfile/:student_name/:student_reg_num",userAuth, admin.getStudentProfile);
router.get("/admin/getStudents",userAuth,admin.getStudents);
router.get("/admin/get_rejected_complaints",userAuth,admin.get_rejected_complaints);
router.post("/admin/post_attendance",userAuth,admin.post_attendance);
router.post("/admin/post_accept_or_resolve",userAuth,admin.post_acceptorresolve);    



router.get("/admin/get_complaints_summary",userAuth,admin.get_complaints_summary);
module.exports = router