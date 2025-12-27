const express = require("express");
const router = express.Router();
const faculty = require("../controllers/facultyController");
const upload = require("../utils/multerSetup");

router.get("/faculty/get_complaints/:id",faculty.get_complaints);
router.get("/faculty/get_complaints_history/:faculty_id",faculty.get_complaints_history);
router.get("/faculty/profile/:faculty_id",faculty.profile); 

router.post('/faculty/complaints',faculty.createComplaint);
router.get('/faculty/get_students',faculty.getStudents); // new route for fetching students

router.get("/faculty/complaints/:complaint_id", faculty.getComplaintById);
router.put("/faculty/updatecomplaint/:complaintId", faculty.updateComplaint);
router.get("/faculty/get_schedule_meetings/:faculty_id", faculty.get_schedule_meetings);
router.post("/faculty/resolve_complaint/:complaint_id", faculty.resolve_complaint);

// router.post("/faculty/post_complaint/:faculty_id",upload.single('id_card'),faculty.post_complaint);
// router.patch("/faculty/update_revoke_status/:complaint_id/:status",faculty.update_revoke_status);
// router.post("/faculty/send_to_admin/:complaint_id/:id",faculty.send_to_admin); // id -> faculty id



module.exports = router;