const express = require("express");
const router = express.Router();
const faculty = require("../controllers/facultyController");
const upload = require("../utils/multerSetup");
const userAuth = require("../middlewares/userAuth");

router.get("/faculty/get_complaints/:id",userAuth,faculty.get_complaints);
router.get("/faculty/get_complaints_history/:faculty_id",userAuth,faculty.get_complaints_history);

router.post('/faculty/complaints',userAuth,faculty.createComplaint);
router.get('/faculty/get_students',userAuth,faculty.getStudents); // new route for fetching students

router.get("/faculty/complaints/:complaint_id",userAuth,faculty.getComplaintById);
router.put("/faculty/updatecomplaint/:complaintId",userAuth, faculty.updateComplaint);
router.get("/faculty/get_schedule_meetings/:faculty_id",userAuth, faculty.get_schedule_meetings);
router.post("/faculty/resolve_complaint/:complaint_id",userAuth, faculty.resolve_complaint);


// router.post("/faculty/post_complaint/:faculty_id",upload.single('id_card'),faculty.post_complaint);
// router.patch("/faculty/update_revoke_status/:complaint_id/:status",faculty.update_revoke_status);
// router.post("/faculty/send_to_admin/:complaint_id/:id",faculty.send_to_admin); // id -> faculty id



module.exports = router;