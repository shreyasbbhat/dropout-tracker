package com.rnsit.dropouttracker.service;

import com.rnsit.dropouttracker.entity.FollowUpRecord;
import com.rnsit.dropouttracker.entity.Student;
import com.rnsit.dropouttracker.entity.Teacher;
import com.rnsit.dropouttracker.repository.FollowUpRecordRepository;
import com.rnsit.dropouttracker.repository.StudentRepository;
import com.rnsit.dropouttracker.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FollowUpService {

    @Autowired
    private FollowUpRecordRepository followUpRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    public FollowUpRecord logFollowUp(Long studentId, Long teacherId, String mode, String reason, String remarks) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        FollowUpRecord record = new FollowUpRecord();
        record.setStudent(student);
        record.setTeacher(teacher);
        record.setFollowupDate(LocalDate.now());
        
        // FIX 1: Set as String instead of Enum
        record.setContactMode(mode.toUpperCase()); 
        record.setAbsenceReason(reason);
        record.setRemarks(remarks);
        
        // FIX 2: Set as String instead of Enum
        record.setResolutionStatus("OPEN"); 

        return followUpRepository.save(record);
    }

    public List<FollowUpRecord> getStudentFollowUps(Long studentId) {
        // FIX 3: Match the exact repository method name (with the underscore)
        return followUpRepository.findByStudent_StudentId(studentId);
    }

    public void deleteFollowUp(Long id) {
        followUpRepository.deleteById(id);
    }
}