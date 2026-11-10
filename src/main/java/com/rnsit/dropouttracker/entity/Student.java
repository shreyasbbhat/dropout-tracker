package com.rnsit.dropouttracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "roll_number", nullable = false, unique = true, length = 20)
    private String rollNumber;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "class_section", nullable = false, length = 20)
    private String classSection;

    @Column(name = "guardian_name", nullable = false, length = 100)
    private String guardianName;

    @Column(name = "guardian_phone", nullable = false, length = 15)
    private String guardianPhone;

    @Column(name = "days_present")
    private Integer daysPresent = 0;

    @Column(name = "days_absent")
    private Integer daysAbsent = 0;

    @Column(name = "total_working_days")
    private Integer totalWorkingDays = 200;

    @Column(name = "attendance_percentage")
    private Double attendancePercentage = 100.0;

    @Column(name = "consecutive_absences")
    private Integer consecutiveAbsences = 0;

    @Column(name = "risk_factor")
    private String riskFactor = "NONE";

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_status")
    private RiskStatus riskStatus = RiskStatus.SAFE;
}