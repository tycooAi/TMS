package com.transport.tms.governance.system.service;

import com.transport.tms.common.exception.Exceptions.ResourceNotFoundException;
import com.transport.tms.governance.audit.service.AuditService;
import com.transport.tms.governance.system.entity.FeatureFlag;
import com.transport.tms.governance.system.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<FeatureFlag> getAllFlags() {
        return featureFlagRepository.findAllByOrderByCategoryAscNameAsc();
    }

    @Transactional
    public FeatureFlag toggleFlag(String flagKey, boolean enabled, String performedBy) {
        FeatureFlag flag = featureFlagRepository.findById(flagKey)
                .orElseThrow(() -> new ResourceNotFoundException("FeatureFlag", "key", flagKey));

        boolean oldVal = flag.getEnabled();
        flag.setEnabled(enabled);
        flag.setUpdatedBy(performedBy != null ? performedBy : "ADMIN");
        flag.setUpdatedAt(LocalDateTime.now());
        FeatureFlag saved = featureFlagRepository.save(flag);

        auditService.recordAudit(
                "FEATURE_FLAG",
                flagKey,
                "ADMIN → TOGGLED FEATURE FLAG",
                "enabled",
                String.valueOf(oldVal),
                String.valueOf(enabled),
                "Feature flag toggled to " + (enabled ? "ENABLED" : "DISABLED"),
                performedBy != null ? performedBy : "ADMIN",
                null
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public boolean isFeatureEnabled(String flagKey) {
        return featureFlagRepository.findById(flagKey)
                .map(FeatureFlag::getEnabled)
                .orElse(true);
    }
}
