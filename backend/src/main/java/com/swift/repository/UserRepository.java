/** Provides database access to registered Swift users. */
package com.swift.repository;

import com.swift.entity.User;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findBySwiftHandle(String swiftHandle);

    List<User> findBySwiftHandleIn(Collection<String> handles);

    boolean existsByEmail(String email);

    boolean existsBySwiftHandle(String swiftHandle);
}
