package com.rnsit.dropouttracker.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "follow_up_records")
@Data
public class FollowUpRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "followup_id")
    private Long followupId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Column(name = "followup_date", nullable = false)
    private LocalDate followupDate;

    @Column(name = "contact_mode", nullable = false)
    private String contactMode;

    @Column(name = "absence_reason", nullable = false)
    private String absenceReason;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "resolution_status")
    private String resolutionStatus = "OPEN";
}