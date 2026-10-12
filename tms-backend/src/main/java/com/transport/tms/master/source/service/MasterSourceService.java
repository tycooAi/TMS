package com.transport.tms.master.source.service;

import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.master.source.entity.FuelStation;
import com.transport.tms.master.source.entity.LocationItem;
import com.transport.tms.master.source.entity.Material;
import com.transport.tms.master.source.entity.Source;
import com.transport.tms.master.source.repository.FuelStationRepository;
import com.transport.tms.master.source.repository.LocationRepository;
import com.transport.tms.master.source.repository.MaterialRepository;
import com.transport.tms.master.source.repository.SourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MasterSourceService {

    private final SourceRepository sourceRepository;
    private final MaterialRepository materialRepository;
    private final LocationRepository locationRepository;
    private final FuelStationRepository fuelStationRepository;

    // Sources (Crushers)
    @Transactional(readOnly = true)
    public List<Source> getAllSources() {
        return sourceRepository.findAll();
    }

    @Transactional
    public Source createSource(Source source) {
        if (source.getId() == null || source.getId().isBlank()) {
            source.setId("SRC-" + String.format("%03d", (int)(Math.random() * 900) + 100));
        } else if (sourceRepository.existsById(source.getId().trim())) {
            throw new Exceptions.BadRequestException("Source ID '" + source.getId() + "' already exists!");
        }
        source.setId(source.getId().trim());
        if (source.getMaterial() == null || source.getMaterial().isBlank()) {
            source.setMaterial("Aggregate / M-Sand");
        }
        if (source.getEffectiveFrom() == null) {
            source.setEffectiveFrom(java.time.LocalDate.now());
        }
        if (source.getStatus() == null || source.getStatus().isBlank()) {
            source.setStatus("ACTIVE");
        }
        if (source.getLocation() == null || source.getLocation().isBlank()) {
            source.setLocation("Sayalgudi Quarry Area");
        }
        return sourceRepository.save(source);
    }

    @Transactional
    public Source updateSource(String id, Source request) {
        Source source = sourceRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Source", "id", id));
        if (request.getName() != null) source.setName(request.getName());
        if (request.getLocation() != null) source.setLocation(request.getLocation());
        if (request.getContactPerson() != null) source.setContactPerson(request.getContactPerson());
        if (request.getPhone() != null) source.setPhone(request.getPhone());
        if (request.getMaterial() != null) source.setMaterial(request.getMaterial());
        if (request.getPricePerTon() != null) source.setPricePerTon(request.getPricePerTon());
        if (request.getStatus() != null) source.setStatus(request.getStatus());
        return sourceRepository.save(source);
    }

    @Transactional
    public void deleteSource(String id) {
        sourceRepository.deleteById(id);
    }

    // Materials
    @Transactional(readOnly = true)
    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    @Transactional
    public Material createMaterial(Material material) {
        if (material.getId() == null || material.getId().isBlank()) {
            material.setId("MAT-" + String.format("%03d", (int)(Math.random() * 900) + 100));
        } else if (materialRepository.existsById(material.getId().trim())) {
            throw new Exceptions.BadRequestException("Material ID '" + material.getId() + "' already exists!");
        }
        material.setId(material.getId().trim());
        if (material.getCategory() == null || material.getCategory().isBlank()) {
            material.setCategory("AGGREGATE");
        }
        if (material.getStandardUnit() == null || material.getStandardUnit().isBlank()) {
            material.setStandardUnit("Ton");
        }
        if (material.getStatus() == null || material.getStatus().isBlank()) {
            material.setStatus("ACTIVE");
        }
        return materialRepository.save(material);
    }

    @Transactional
    public Material updateMaterial(String id, Material request) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Material", "id", id));
        if (request.getName() != null) material.setName(request.getName());
        if (request.getCategory() != null) material.setCategory(request.getCategory());
        if (request.getStandardUnit() != null) material.setStandardUnit(request.getStandardUnit());
        if (request.getStatus() != null) material.setStatus(request.getStatus());
        return materialRepository.save(material);
    }

    @Transactional
    public void deleteMaterial(String id) {
        materialRepository.deleteById(id);
    }

    // Locations
    @Transactional(readOnly = true)
    public List<LocationItem> getAllLocations() {
        return locationRepository.findAll();
    }

    @Transactional
    public LocationItem createLocation(LocationItem location) {
        if (location.getId() == null || location.getId().isBlank()) {
            location.setId("LOC-" + String.format("%03d", (int)(Math.random() * 900) + 100));
        } else if (locationRepository.existsById(location.getId().trim())) {
            throw new Exceptions.BadRequestException("Location ID '" + location.getId() + "' already exists!");
        }
        location.setId(location.getId().trim());
        if (location.getType() == null || location.getType().isBlank()) {
            location.setType("SITE");
        }
        if (location.getStatus() == null || location.getStatus().isBlank()) {
            location.setStatus("ACTIVE");
        }
        return locationRepository.save(location);
    }

    @Transactional
    public LocationItem updateLocation(String id, LocationItem request) {
        LocationItem location = locationRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Location", "id", id));
        if (request.getName() != null) location.setName(request.getName());
        if (request.getType() != null) location.setType(request.getType());
        if (request.getAddress() != null) location.setAddress(request.getAddress());
        if (request.getDistanceKm() != null) location.setDistanceKm(request.getDistanceKm());
        if (request.getStatus() != null) location.setStatus(request.getStatus());
        return locationRepository.save(location);
    }

    @Transactional
    public void deleteLocation(String id) {
        locationRepository.deleteById(id);
    }

    // Fuel Stations
    @Transactional(readOnly = true)
    public List<FuelStation> getAllFuelStations() {
        return fuelStationRepository.findAll();
    }

    @Transactional
    public FuelStation createFuelStation(FuelStation fuelStation) {
        if (fuelStation.getId() == null || fuelStation.getId().isBlank()) {
            fuelStation.setId("PMP-" + String.format("%03d", (int)(Math.random() * 900) + 100));
        } else if (fuelStationRepository.existsById(fuelStation.getId().trim())) {
            throw new Exceptions.BadRequestException("Fuel Station ID '" + fuelStation.getId() + "' already exists!");
        }
        fuelStation.setId(fuelStation.getId().trim());
        if (fuelStation.getLocation() == null || fuelStation.getLocation().isBlank()) {
            fuelStation.setLocation("Main Highway Pump");
        }
        if (fuelStation.getStatus() == null || fuelStation.getStatus().isBlank()) {
            fuelStation.setStatus("ACTIVE");
        }
        return fuelStationRepository.save(fuelStation);
    }

    @Transactional
    public FuelStation updateFuelStation(String id, FuelStation request) {
        FuelStation fuelStation = fuelStationRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("FuelStation", "id", id));
        if (request.getName() != null) fuelStation.setName(request.getName());
        if (request.getLocation() != null) fuelStation.setLocation(request.getLocation());
        if (request.getContactPerson() != null) fuelStation.setContactPerson(request.getContactPerson());
        if (request.getPhone() != null) fuelStation.setPhone(request.getPhone());
        if (request.getStatus() != null) fuelStation.setStatus(request.getStatus());
        return fuelStationRepository.save(fuelStation);
    }

    @Transactional
    public void deleteFuelStation(String id) {
        fuelStationRepository.deleteById(id);
    }
}
