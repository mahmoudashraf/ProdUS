package com.produs.engine;

import com.produs.engine.DiagnosisQualityHarnessService.FixtureSummary;
import com.produs.engine.DiagnosisQualityHarnessService.HarnessRunRequest;
import com.produs.engine.DiagnosisQualityHarnessService.HarnessRunResponse;
import com.produs.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/productization-engine/diagnosis-quality")
@RequiredArgsConstructor
public class DiagnosisQualityHarnessController {

    private final DiagnosisQualityHarnessService harnessService;

    @GetMapping("/fixtures")
    public List<FixtureSummary> fixtures(@AuthenticationPrincipal User user) {
        requireAdmin(user);
        return harnessService.fixtures();
    }

    @PostMapping("/run")
    public HarnessRunResponse run(@AuthenticationPrincipal User user, @RequestBody(required = false) HarnessRunRequest request) {
        requireAdmin(user);
        return harnessService.run(request);
    }

    private static void requireAdmin(User user) {
        if (user != null && user.getRole() == User.UserRole.ADMIN) {
            return;
        }
        throw new AccessDeniedException("Diagnosis quality harness is available to admins only");
    }
}
