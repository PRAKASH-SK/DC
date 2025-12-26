CREATE TABLE faculty_logger (
    complaint_id VARCHAR(20) PRIMARY KEY, 
    student_id bigint NOT NULL,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    complaint TEXT NOT NULL,
    venue VARCHAR(200) NOT NULL,
    faculty_id VARCHAR(200),
    status ENUM('pending', 'accepted', 'rejected', 'forwarded') DEFAULT 'pending',
    revoke_message text,
    FOREIGN KEY (student_id) REFERENCES users(user_id)
     on delete cascade
     on update cascade
);

create table faculty_to_admin_issues (
    complaint_id varchar(20) primary key,
    forwarded_date_time datetime not null,
    foreign key (complaint_id) references faculty_logger(complaint_id)
    on delete cascade
    on update cascade
);

create table meetings (
    meeting_id varchar(25) primary key,
    complaint_id varchar(20) not null,
    admin_id bigint not null,
    venue varchar(200) not null,
    date_time datetime not null,
    info text not null,
    attendence enum ('pending','present','absent'),
    foreign key (admin_id) references users(user_id)
    on delete cascade
    on update cascade
);

create table roles(
    role_id int primary key,
    role varchar(200) not null unique
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    emailId VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    register_number VARCHAR(50), -- For students (NULL for others)
    department VARCHAR(100),     -- For students & faculty
    year INT,                    -- For students
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    index email_idx (emailId)
    index register_number(register_number)
);