package com.rnsit.dropouttracker.service;

import com.rnsit.dropouttracker.entity.AttendanceLog;
import com.rnsit.dropouttracker.entity.RiskStatus;
import com.rnsit.dropouttracker.entity.Student;
import com.rnsit.dropouttracker.repository.AttendanceLogRepository;
import com.rnsit.dropouttracker.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceLogRepository attendanceLogRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentService studentService;

    public Student markAttendance(Long studentId, LocalDate date, Boolean isPresent) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        int present = student.getDaysPresent() == null ? 0 : student.getDaysPresent();
        int absent = student.getDaysAbsent() == null ? 0 : student.getDaysAbsent();
        double currentPct = student.getAttendancePercentage() == null ? 100.0 : student.getAttendancePercentage();

        Optional<AttendanceLog> existingLogOpt = attendanceLogRepository.findByStudentAndAttendanceDate(student, date);

        if (existingLogOpt.isPresent()) {
            AttendanceLog existingLog = existingLogOpt.get();
            
            // If the teacher clicks the exact same button twice, do nothing
            if (existingLog.getIsPresent().equals(isPresent)) {
                return student;
            }
            
            // Toggle the attendance record to fix the teacher's mistake
            existingLog.setIsPresent(isPresent);
            attendanceLogRepository.save(existingLog);

            if (isPresent) {
                // Reversing an Absent mistake into a Present
                student.setDaysAbsent(Math.max(0, absent - 1));
                student.setDaysPresent(present + 1);
                student.setConsecutiveAbsences(0);
                student.setAttendancePercentage(Math.min(100.0, currentPct + 4.0)); 
            } else {
                // Reversing a Present mistake into an Absent
                student.setDaysPresent(Math.max(0, present - 1));
                student.setDaysAbsent(absent + 1);
                student.setConsecutiveAbsences(student.getConsecutiveAbsences() + 1);
                student.setAttendancePercentage(Math.max(0.0, currentPct - 4.0));
            }
        } else {
            // Completely new record for the selected date
            AttendanceLog log = new AttendanceLog();
            log.setStudent(student);
            log.setAttendanceDate(date);
            log.setIsPresent(isPresent);
            attendanceLogRepository.save(log);

            if (isPresent) {
                student.setDaysPresent(present + 1);
                student.setConsecutiveAbsences(0);
                student.setAttendancePercentage(Math.min(100.0, currentPct + 1.5));
            } else {
                student.setDaysAbsent(absent + 1);
                student.setConsecutiveAbsences(student.getConsecutiveAbsences() + 1);
                student.setAttendancePercentage(Math.max(0.0, currentPct - 2.5));
            }
        }

        studentRepository.save(student);
        return studentService.updateStudentRiskStatus(studentId);
    }

    @Transactional
    public void resetAttendance(String classSection) {
        attendanceLogRepository.deleteAll();
        List<Student> students = (classSection == null || classSection.equalsIgnoreCase("ALL"))
                ? studentRepository.findAll()
                : studentRepository.findByClassSection(classSection);

        for (Student s : students) {
            s.setDaysPresent(0);
            s.setDaysAbsent(0);
            s.setConsecutiveAbsences(0);
            s.setAttendancePercentage(100.0);
            s.setRiskStatus(RiskStatus.SAFE);
        }
        studentRepository.saveAll(students);
    }
}