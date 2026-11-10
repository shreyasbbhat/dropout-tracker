package com.rnsit.dropouttracker.repository;

import com.rnsit.dropouttracker.entity.FollowUpRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FollowUpRecordRepository extends JpaRepository<FollowUpRecord, Long> {
    List<FollowUpRecord> findByStudent_StudentId(Long studentId);
}