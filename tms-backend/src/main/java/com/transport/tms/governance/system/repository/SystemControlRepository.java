package com.transport.tms.governance.system.repository;

import com.transport.tms.governance.system.entity.SystemControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemControlRepository extends JpaRepository<SystemControl, Integer> {
}
