package com.transport.tms.master.customer.service;

import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.master.customer.entity.Customer;
import com.transport.tms.master.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final IdGenerator idGenerator;

    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Customer getCustomerById(String id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Customer", "id", id));
    }

    @Transactional(readOnly = true)
    public Customer getCustomerByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new Exceptions.BadRequestException("Phone number is required for lookup");
        }
        String cleanPhone = phone.trim();
        Optional<Customer> found = customerRepository.findByPhone(cleanPhone);
        if (found.isPresent()) return found.get();
        
        List<Customer> matches = customerRepository.searchCustomers(cleanPhone);
        if (!matches.isEmpty()) return matches.get(0);
        
        // Remove symbols/spaces (e.g. +91 94431 52671 -> 9443152671)
        String digits = cleanPhone.replaceAll("[^0-9]", "");
        if (digits.length() >= 6) {
            String suffix = digits.substring(Math.max(0, digits.length() - 10));
            List<Customer> digitMatches = customerRepository.searchCustomers(suffix);
            if (!digitMatches.isEmpty()) return digitMatches.get(0);
        }
        
        throw new Exceptions.ResourceNotFoundException("Customer", "phone", phone);
    }

    @Transactional(readOnly = true)
    public List<Customer> searchCustomers(String query) {
        return customerRepository.searchCustomers(query);
    }

    @Transactional
    public Customer createCustomer(Customer customer) {
        if (customerRepository.existsByPhone(customer.getPhone().trim())) {
            throw new Exceptions.BadRequestException("A customer with phone " + customer.getPhone() + " already exists!");
        }

        if (customer.getId() == null || customer.getId().isBlank()) {
            customer.setId(idGenerator.generateCustomerId());
        } else if (customerRepository.existsById(customer.getId().trim())) {
            throw new Exceptions.BadRequestException("Customer ID '" + customer.getId() + "' already exists!");
        }
        customer.setId(customer.getId().trim());
        customer.setPhone(customer.getPhone().trim());
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(String id, Customer request) {
        Customer customer = getCustomerById(id);
        
        // If phone changed, verify uniqueness
        if (!customer.getPhone().equalsIgnoreCase(request.getPhone().trim())) {
            if (customerRepository.existsByPhone(request.getPhone().trim())) {
                throw new Exceptions.BadRequestException("Phone number " + request.getPhone() + " is already assigned to another customer!");
            }
            customer.setPhone(request.getPhone().trim());
        }

        customer.setName(request.getName());
        customer.setAlternatePhone(request.getAlternatePhone());
        customer.setAddress(request.getAddress());
        customer.setGstin(request.getGstin());
        customer.setCreditTerms(request.getCreditTerms());
        customer.setStatus(request.getStatus());
        customer.setNotes(request.getNotes());

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(String id) {
        Customer customer = getCustomerById(id);
        customer.setStatus("INACTIVE");
        customerRepository.save(customer);
    }
}
