/** Builds transaction history and summary data from the wallet ledger. */
package com.swift.service;

import com.swift.dto.TransactionResponse;
import com.swift.entity.Transaction;
import com.swift.entity.User;
import com.swift.repository.TransactionRepository;
import com.swift.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TransactionResponse> myLedger(String handle, int limit) {
        int pageSize = Math.min(Math.max(limit, 1), 500);
        List<Transaction> rows = transactionRepository.findLedgerFor(handle, PageRequest.of(0, pageSize));

        // One query to turn handles into display names (no N+1).
        Set<String> handles = rows.stream()
                .flatMap(t -> Stream.of(t.getSenderHandle(), t.getReceiverHandle()))
                .collect(Collectors.toSet());
        Map<String, String> names = handles.isEmpty()
                ? Map.of()
                : userRepository.findBySwiftHandleIn(handles).stream()
                        .collect(Collectors.toMap(User::getSwiftHandle, User::getFullName));

        return rows.stream().map(t -> TransactionResponse.from(t, handle, names)).toList();
    }
}
