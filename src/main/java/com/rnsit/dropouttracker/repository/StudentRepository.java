package com.rnsit.dropouttracker.repository;

import com.rnsit.dropouttracker.entity.Student;
import com.rnsit.dropouttracker.entity.RiskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRollNumber(String rollNumber);
    List<Student> findByRiskStatus(RiskStatus riskStatus);
    List<Student> findByClassSection(String classSection);
}