package com.transport.tms.governance.system.repository;

import com.transport.tms.governance.system.entity.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BackupRecordRepository extends JpaRepository<BackupRecord, String> {
    List<BackupRecord> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
