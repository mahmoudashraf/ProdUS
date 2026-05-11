package com.produs.mapper;

import com.produs.dto.UserDto;
import com.produs.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {
    UserDto toDto(User user);
    User toEntity(UserDto userDto);
}
