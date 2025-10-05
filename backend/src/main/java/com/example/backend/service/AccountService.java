package com.example.backend.service;

import com.example.backend.model.Account;
import java.util.List;
import java.util.Optional;

public interface AccountService {
    List<Account> getAllAccounts();
    Optional<Account> getAccountById(String id);
    Account createAccount(Account account);
    Account updateAccount(String id, Account accountDetails);
    boolean deleteAccount(String id);
}
