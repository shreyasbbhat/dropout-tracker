package com.rnsit.dropouttracker.repository;

import com.rnsit.dropouttracker.entity.AttendanceLog;
import com.rnsit.dropouttracker.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {
    // This allows us to check if attendance is already marked today
    Optional<AttendanceLog> findByStudentAndAttendanceDate(Student student, LocalDate date);
}