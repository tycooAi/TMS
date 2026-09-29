package com.transport.tms.governance.system.repository;

import com.transport.tms.governance.system.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, String> {
    List<FeatureFlag> findAllByOrderByCategoryAscNameAsc();
}
