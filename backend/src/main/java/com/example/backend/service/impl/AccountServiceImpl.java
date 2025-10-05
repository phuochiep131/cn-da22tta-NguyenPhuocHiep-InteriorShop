package com.example.backend.service.impl;

import com.example.backend.model.Account;
import com.example.backend.repository.AccountRepository;
import com.example.backend.service.AccountService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AccountServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    @Override
    public Optional<Account> getAccountById(String id) {
        return accountRepository.findById(id);
    }

    @Override
    public Account createAccount(Account account) {
        // Mã hóa mật khẩu trước khi lưu
        String encodedPassword = passwordEncoder.encode(account.getPassword());
        account.setPassword(encodedPassword);
        return accountRepository.save(account);
    }

    @Override
    public Account updateAccount(String id, Account accountDetails) {
        return accountRepository.findById(id).map(acc -> {
            acc.setUsername(accountDetails.getUsername());
            acc.setAvatar(accountDetails.getAvatar());
            acc.setEmail(accountDetails.getEmail());
            acc.setRole(accountDetails.getRole());

            // Nếu người dùng gửi mật khẩu mới → mã hóa lại
            if (accountDetails.getPassword() != null && !accountDetails.getPassword().isEmpty()) {
                acc.setPassword(passwordEncoder.encode(accountDetails.getPassword()));
            }

            return accountRepository.save(acc);
        }).orElse(null);
    }

    @Override
    public boolean deleteAccount(String id) {
        if (accountRepository.existsById(id)) {
            accountRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
