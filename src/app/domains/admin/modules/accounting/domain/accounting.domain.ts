import { BasicDTO } from '@/app/shared/domain/shared.domain';

export class CatalogDTO extends BasicDTO {
  key: string;
  name: string;
  code: string;
  initialDate: Date;
  finalDate: Date;
  accounts: AccountDTO[];
  template: string;
}

export class AccountDTO extends BasicDTO {
  key: string;
  catalog: string;
  code: string;
  name: string;
  parent: string;
  template: string;
  field: string;
  type: string;
  operation: string;
  status: string;
  wbs: string;
  level: number;
}

export class TimeFrame extends BasicDTO {
  level: number;
  code: string;
  startDate: Date;
  endDate: Date;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export class ResultMapDTO extends BasicDTO {
  key: string;
  catalog: string;
  account: string;
  accountName: string;
  accountCode: string;
  timeFrame: string;
  timeFrameName: string;
  quantity: number;
  lastBalance: number;
  nextBalance: number;
  positive: number;
  negative: number;
  value: number;
}

export class ManualDTO extends BasicDTO {
  key: string;
  catalog: string;
  code: string;
  concept: string;
  factDate: Date;
  registerUser: Date;
  registerDate: Date;
  value: number;
}

export class Voucher {
  header: ManualDTO;
  records: VoucherLine[];
}

export class ManualAccountDTO extends BasicDTO {
  key: string;
  account: string;
  accountName: string;
  accountCode: string;
  accountDTO: AccountDTO;
  positive: number;
  negative: number;
  note: string;
}

export class ManualAccountAuxiliarDTO extends BasicDTO {
  recordLine: string;
  account: string;
  auxiliarType: string;
  auxiliarDocumentId: string;
  auxiliarCode: string;
  auxiliarName: string;
}

export class VoucherLine {
  line: ManualAccountDTO;
  references: ManualAccountAuxiliarDTO[];
}

export class VoucherPrepareRequest {
  serviceId: string;
  documentId: string;
}
