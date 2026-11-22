// Shapes of the JSON returned by the Spring Boot API.

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  fullName: string;
  email: string;
  swiftHandle: string;
}

export interface Wallet {
  walletId: number;
  fullName: string;
  swiftHandle: string;
  balance: number;
  currencySymbol: string;
  cardLast4: string;
  cvv: string;
  cardFrozen: boolean;
  txLimit: number;
}

export type TxStatus = 'SUCCESS' | 'FAILED';

export interface LedgerTx {
  id: number;
  referenceId: string;
  senderHandle: string;
  receiverHandle: string;
  amount: number;
  status: TxStatus;
  failureReason: string | null;
  createdAt: string;
  direction: 'SENT' | 'RECEIVED';
  counterpartyHandle: string;
  counterpartyName: string;
  note: string | null;
}

export interface TransferResult {
  referenceId: string;
  status: TxStatus;
  senderHandle: string;
  receiverHandle: string;
  amount: number;
  senderBalanceAfter: number;
  message: string;
  createdAt: string;
  replayed: boolean;
}

export interface UserLookup {
  fullName: string;
  swiftHandle: string;
}

export interface Contact {
  handle: string;
  name: string;
}

export type Currency = '₹' | '$' | '€';
