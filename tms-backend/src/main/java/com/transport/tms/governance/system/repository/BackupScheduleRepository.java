package com.transport.tms.governance.system.repository;

import com.transport.tms.governance.system.entity.BackupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BackupScheduleRepository extends JpaRepository<BackupSchedule, String> {
    List<BackupSchedule> findAllByOrderByScheduleTypeAsc();
}
