package com.rnsit.dropouttracker.controller;

import com.rnsit.dropouttracker.entity.Student;
import com.rnsit.dropouttracker.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/mark")
    public Student markAttendance(@RequestParam Long studentId,
                                  @RequestParam String date,
                                  @RequestParam Boolean isPresent) {
        return attendanceService.markAttendance(studentId, LocalDate.parse(date), isPresent);
    }

    @PostMapping("/reset")
    public String resetAttendance(@RequestParam(defaultValue = "ALL") String classSection) {
        attendanceService.resetAttendance(classSection);
        return "Attendance reset to 0 days successfully";
    }
}