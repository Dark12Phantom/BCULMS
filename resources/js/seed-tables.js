async function seedDepartments() {
  db.run(`INSERT OR IGNORE INTO "department" ("department_id","name") VALUES 
    ('CBA','College of Business Administration'),
    ('CCJE','College of Criminal Justice Education'),
    ('CoE','College of Engineering'),
    ('CNSM','College of Nursing and School of Midwifery'),
    ('ES','Elementary School'),
    ('JHS','Junior High School'),
    ('SHS','Senior High School'),
    ('CTELA','College of Teacher Education and Liberal Arts'),
    ('CHTM','College of Hospitality and Tourism Management'),
    ('GS','Graduate School'),
    ('RD','Research Department');`);
}

async function seedCourses() {
    // CBA Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSBA-FM','Bachelor of Science in Business Administration Major in Financial Management','CBA'),
      ('BSBA-HRDM','Bachelor of Science in Business Administration Major in Human Resource Development Management','CBA'),
      ('BSCS','Bachelor of Science in Cmputer Sciebce','CBA'),
      ('BSOA','Bachelor of Science in Office Administration','CBA'),
      ('BSPA','Bachelor of Science in Public Administration','CBA')`
    );
    // CTELA Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BEED','Bachelor of Elementary Education','CTELA'),
      ('BSED-ENG','Bachelor of Secondary Education Major in English','CTELA'),
      ('BSED-FIL','Bachelor of Secondary Education Major in Filipino','CTELA'),
      ('BSED-MATH','Bachelor of Secondary Education Major in Mathematics','CTELA'),
      ('BSED-GS','Bachelor of Secondary Education Major in General Science','CTELA'),
      ('BSED-VE','Bachelor of Secondary Education Major in Values Education','CTELA'),
      ('BCAED','Bachelor of Culture & Arts Education','CTELA'),
      ('BPED','Bachelor of Physical Education','CTELA'),
      ('BECE','Bachelor of Early Childhood Education','CTELA'),
      ('ABE','Bachelor of Arts in English','CTELA'),
      ('ABPS','Bachelor of Arts in Political Science','CTELA')`
    );
    // CHTM Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('AHM','Associate in Hospitality Management','CHTM'),
      ('BSHM','Bachelor of Science in Hospitality Management','CHTM'),
      ('BSTM','Bachelor of Science in Tourism Management','CHTM')`
    );
    // CoE Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSCE','Bachelor of Science in Civil Engineering','CoE'),
      ('BSGE','Bachelor of Science in Geodetic Engineering','CoE')`
    );
    // CCJE Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSCRIM','Bachelor of Science in Criminology','CCJE')`
    );
    // CNSM Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('BSN','Bachelor of Science in Nursing','CNSM'),
      ('DIPMID','Diploma in Midwifery','CNSM')`
    );
    // GS Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('PhDAS','Doctor of Philosophy in Administration and Supervision','GS'),
      ('Ed.D Educ Mgt','Doctor of Education in Educational Management','GS'),
      ('MAAS','Master of Arts in Administration and Supervision','GS'),
      ('MAEE','Master of Arts in Elementary Education','GS'),
      ('MAEng','Master of Arts in English','GS'),
      ('MAFil','Master of Arts in Filipino','GS'),
      ('MAGC','Master of Arts in Guidance Counseling','GS'),
      ('MAMath','Master of Arts in Mathematics','GS'),
      ('MAEd-Pre-Elem','Master of Arts in Pre-Elementary Education','GS'),
      ('MAHE','Master of Arts in Home Economics','GS'),
      ('MBA','Master in Business Administration','GS'),
      ('MPA','Master in Public Administration','GS')`
    );
    // ES, JHS, SHS Courses
    db.run(`INSERT OR IGNORE INTO "course" ("course_id","name","department_id") VALUES 
      ('ELEMENTARY','Elementary Level','ES'),
      ('JUNIOR HIGH','Junior High School Level','JHS'),
      ('SENIOR HIGH','Senior High School Level','SHS')`
    );
}