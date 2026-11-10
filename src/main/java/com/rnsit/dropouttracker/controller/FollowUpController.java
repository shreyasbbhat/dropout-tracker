package com.rnsit.dropouttracker.controller;

import com.rnsit.dropouttracker.entity.FollowUpRecord;
import com.rnsit.dropouttracker.service.FollowUpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/followup")
public class FollowUpController {

    @Autowired
    private FollowUpService followUpService;

    @PostMapping("/log")
    public FollowUpRecord logFollowUp(@RequestParam Long studentId,
                                      @RequestParam Long teacherId,
                                      @RequestParam String mode,
                                      @RequestParam String reason,
                                      @RequestParam String remarks) {
        return followUpService.logFollowUp(studentId, teacherId, mode, reason, remarks);
    }

    @GetMapping("/student/{studentId}")
    public List<FollowUpRecord> getStudentFollowUps(@PathVariable Long studentId) {
        return followUpService.getStudentFollowUps(studentId);
    }

    @DeleteMapping("/{id}")
    public void deleteFollowUp(@PathVariable Long id) {
        followUpService.deleteFollowUp(id);
    }
}