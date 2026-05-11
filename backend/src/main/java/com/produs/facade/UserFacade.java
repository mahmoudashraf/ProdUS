package com.produs.facade;

import com.produs.dto.UserDto;
import com.produs.entity.User;
import com.produs.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserFacade {

    private final UserService userService;

    /**
     * Get current authenticated user profile
     */
    public UserDto getCurrentUserProfile(User authenticatedUser) {
        log.debug("Getting profile for user: {}", authenticatedUser.getEmail());
        return userService.getCurrentUser(authenticatedUser.getId());
    }

    /**
     * Update user profile
     */
    public UserDto updateUserProfile(User authenticatedUser, UserDto userDto) {
        log.debug("Updating profile for user: {}", authenticatedUser.getEmail());
        return userService.updateUser(authenticatedUser.getId(), userDto);
    }
}
