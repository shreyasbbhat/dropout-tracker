package com.rnsit.dropouttracker.service;

import com.rnsit.dropouttracker.entity.Student;
import com.rnsit.dropouttracker.entity.RiskStatus;
import com.rnsit.dropouttracker.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    // Fetch all students for the teacher dashboard
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    // The Core Risk Engine Logic
    public Student updateStudentRiskStatus(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));

        // Syllabus Requirement: Flag < 75% or >= 3 consecutive absences
        if (student.getConsecutiveAbsences() >= 3 || student.getAttendancePercentage() < 75.0) {
            student.setRiskStatus(RiskStatus.HIGH_RISK);
        } else if (student.getAttendancePercentage() >= 75.0 && student.getAttendancePercentage() < 85.0) {
            student.setRiskStatus(RiskStatus.WARNING);
        } else {
            student.setRiskStatus(RiskStatus.SAFE);
        }
        
        return studentRepository.save(student);
    }
}