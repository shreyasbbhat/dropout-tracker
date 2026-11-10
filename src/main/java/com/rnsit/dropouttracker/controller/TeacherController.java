package com.rnsit.dropouttracker.controller;

import com.rnsit.dropouttracker.entity.Teacher;
import com.rnsit.dropouttracker.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    @Autowired
    private TeacherRepository teacherRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email, @RequestParam String password) {
        Optional<Teacher> teacherOpt = teacherRepository.findByEmail(email.trim());
        if (teacherOpt.isPresent() && teacherOpt.get().getPasswordHash().equals(password)) {
            return ResponseEntity.ok(teacherOpt.get());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid teacher email or password");
    }

    @GetMapping
    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }
}
