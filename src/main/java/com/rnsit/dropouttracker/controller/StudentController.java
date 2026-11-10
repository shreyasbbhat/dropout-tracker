package com.rnsit.dropouttracker.controller;

import com.rnsit.dropouttracker.entity.Student;
import com.rnsit.dropouttracker.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<Student> getStudents(@RequestParam(required = false) String classSection) {
        if (classSection != null && !classSection.isBlank() && !classSection.equalsIgnoreCase("ALL")) {
            return studentRepository.findByClassSection(classSection);
        }
        return studentRepository.findAll();
    }
    @PostMapping("/risk")
    public Student updateRiskFactor(@RequestParam Long studentId, @RequestParam String riskFactor) {
        Student student = studentRepository.findById(studentId).orElseThrow();
        student.setRiskFactor(riskFactor);
        return studentRepository.save(student);
    }
}