package com.produs.shortlist;

import com.produs.entity.User;
import com.produs.dto.PlatformDtos.TeamShortlistResponse;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.teams.Team;
import com.produs.teams.TeamRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static com.produs.dto.PlatformDtos.toTeamShortlistResponse;

@RestController
@RequestMapping("/api/shortlists")
@RequiredArgsConstructor
public class TeamShortlistController {

    private final TeamShortlistRepository shortlistRepository;
    private final PackageInstanceRepository packageRepository;
    private final TeamRepository teamRepository;

    @GetMapping
    public List<TeamShortlistResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID packageId
    ) {
        List<TeamShortlist> shortlists;
        if (user.getRole() == User.UserRole.ADMIN && packageId == null) {
            shortlists = shortlistRepository.findAll();
        } else if (packageId == null) {
            shortlists = shortlistRepository.findByOwnerIdOrderByCreatedAtDesc(user.getId());
        } else {
            PackageInstance packageInstance = packageRepository.findById(packageId)
                    .orElseThrow(() -> new IllegalArgumentException("Package not found"));
            requirePackageOwnerOrAdmin(user, packageInstance);
            shortlists = shortlistRepository.findByOwnerIdAndPackageInstanceIdOrderByCreatedAtDesc(
                    packageInstance.getOwner().getId(),
                    packageId
            );
        }
        return shortlists.stream()
                .map(shortlist -> toTeamShortlistResponse(shortlist))
                .toList();
    }

    @PostMapping
    public TeamShortlistResponse upsert(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TeamShortlistPayload request
    ) {
        PackageInstance packageInstance = packageRepository.findById(request.packageInstanceId())
                .orElseThrow(() -> new IllegalArgumentException("Package not found"));
        requirePackageOwnerOrAdmin(user, packageInstance);
        Team team = teamRepository.findById(request.teamId())
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        TeamShortlist shortlist = shortlistRepository
                .findByOwnerIdAndPackageInstanceIdAndTeamId(
                        packageInstance.getOwner().getId(),
                        packageInstance.getId(),
                        team.getId()
                )
                .orElseGet(TeamShortlist::new);
        shortlist.setOwner(packageInstance.getOwner());
        shortlist.setPackageInstance(packageInstance);
        shortlist.setTeam(team);
        shortlist.setStatus(request.status() == null ? TeamShortlist.ShortlistStatus.ACTIVE : request.status());
        shortlist.setNotes(request.notes());
        return toTeamShortlistResponse(shortlistRepository.save(shortlist));
    }

    @PutMapping("/{shortlistId}")
    public TeamShortlistResponse update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID shortlistId,
            @Valid @RequestBody TeamShortlistStatusPayload request
    ) {
        TeamShortlist shortlist = shortlistRepository.findById(shortlistId)
                .orElseThrow(() -> new IllegalArgumentException("Shortlist record not found"));
        requirePackageOwnerOrAdmin(user, shortlist.getPackageInstance());
        shortlist.setStatus(request.status());
        shortlist.setNotes(request.notes());
        return toTeamShortlistResponse(shortlistRepository.save(shortlist));
    }

    @DeleteMapping("/{shortlistId}")
    public void archive(
            @AuthenticationPrincipal User user,
            @PathVariable UUID shortlistId
    ) {
        TeamShortlist shortlist = shortlistRepository.findById(shortlistId)
                .orElseThrow(() -> new IllegalArgumentException("Shortlist record not found"));
        requirePackageOwnerOrAdmin(user, shortlist.getPackageInstance());
        shortlist.setStatus(TeamShortlist.ShortlistStatus.ARCHIVED);
        shortlistRepository.save(shortlist);
    }

    private void requirePackageOwnerOrAdmin(User user, PackageInstance packageInstance) {
        if (user.getRole() == User.UserRole.ADMIN || packageInstance.getOwner().getId().equals(user.getId())) {
            return;
        }
        throw new AccessDeniedException("Shortlist is restricted to the package owner");
    }

    public record TeamShortlistPayload(
            @NotNull UUID packageInstanceId,
            @NotNull UUID teamId,
            TeamShortlist.ShortlistStatus status,
            String notes
    ) {}

    public record TeamShortlistStatusPayload(
            @NotNull TeamShortlist.ShortlistStatus status,
            String notes
    ) {}
}
