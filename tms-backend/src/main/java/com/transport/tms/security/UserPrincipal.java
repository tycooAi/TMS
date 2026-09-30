package com.transport.tms.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.transport.tms.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private String id;
    private String username;
    @JsonIgnore
    private String password;
    private String fullName;
    private String email;
    private String roleName;
    private String status;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        Set<GrantedAuthority> authorities = new HashSet<>();
        
        // Add role as authority: ROLE_ADMIN, ROLE_MD, etc.
        authorities.add(new SimpleGrantedAuthority(user.getRole().getId()));
        
        // Add granular permissions as authorities
        if (user.getRole().getPermissions() != null) {
            user.getRole().getPermissions().forEach(permission -> {
                authorities.add(new SimpleGrantedAuthority(permission.getId()));
            });
        }

        return UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleName(user.getRole().getName())
                .status(user.getStatus())
                .authorities(authorities)
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return "ACTIVE".equalsIgnoreCase(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(status);
    }
}
