import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  DocumentoPlantillaCaracteristicaDTO,
  PedidoVentaDTO,
  PropiedadCampoDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';
import { PropiedadValorDefinidoDTO } from '@/app/shared/domain/shared.domain';

@Injectable({ providedIn: 'root' })
export class UtilsService {
  private readonly dialog = inject(MatDialog);

  private _fieldDialogRef: MatDialogRef<unknown> | null = null;
  private _flexDialogRef: MatDialogRef<unknown> | null = null;

  async modalWithParams(
    pDataModal: PedidoVentaDTO,
    pClose2Save = false,
    pIdentificador: string | null = null,
    pSaveInField = false,
    openQuickTransitionAfterSave: unknown = null,
  ): Promise<unknown> {
    const { default: FormComponent } = await import(
      '@/app/domains/admin/modules/neuron/features/form/form'
    );
    const dialogRef = this.dialog.open(FormComponent, {
      maxHeight: '100vh',
      maxWidth: '98vw',
      disableClose: true,
      data: {
        data: pDataModal,
        close2Save: pClose2Save,
        identificador: pIdentificador,
        saveInField: pSaveInField,
        openQuickTransitionAfterSave,
      },
    });
    return dialogRef.afterClosed().toPromise();
  }

  async modalSuccess(pHtmlToPrint: string): Promise<unknown> {
    const { SuccessComponent } = await import(
      '@/app/domains/admin/modules/neuron/features/success/success'
    );
    const dialogRef = this.dialog.open(SuccessComponent, {
      maxHeight: '100vh',
      maxWidth: '98vw',
      data: { data: pHtmlToPrint },
    });
    return dialogRef.afterClosed().toPromise();
  }

  async modalTransfer(
    document: string,
    state: string,
    template: string,
    server: string,
  ): Promise<unknown> {
    // TODO: Import TransferFormComponent when transfer module is migrated
    console.warn('modalTransfer: TransferFormComponent not yet migrated');
    return Promise.resolve(null);
  }

  async modalTrace(
    document: string,
    template: string,
    server: string,
    documentName: string,
    documentState: string,
    state: string,
  ): Promise<unknown> {
    // TODO: Import TrazabilityComponent when document-transition module is migrated
    console.warn('modalTrace: TrazabilityComponent not yet migrated');
    return Promise.resolve(null);
  }

  async modalVoucher(_key: string, _catalog: string): Promise<unknown> {
    const { default: ManualFormComponent } = await import(
      '@/app/domains/admin/modules/accounting/features/manual-form/manual-form'
    );
    const dialogRef = this.dialog.open(ManualFormComponent, {
      maxHeight: '100vh',
      maxWidth: '98vw',
      disableClose: true,
      data: { key: _key, catalogId: _catalog },
    });
    return dialogRef.afterClosed().toPromise();
  }

  async modalUser(_key: string): Promise<unknown> {
    const { default: PersonsDetailComponent } = await import(
      '@/app/domains/admin/modules/persons/features/persons-detail/persons-detail'
    );
    const dialogRef = this.dialog.open(PersonsDetailComponent, {
      maxHeight: '100vh',
      maxWidth: '98vw',
      data: { key: _key },
    });
    return dialogRef.afterClosed().toPromise();
  }

  async modalUserChangePassOther(_key: UsuarioDTO): Promise<unknown> {
    // TODO: Import DFA component when DFA module is migrated
    console.warn('modalUserChangePassOther: dfaComponent not yet migrated');
    return Promise.resolve(null);
  }

  async modalUserChangePass(): Promise<unknown> {
    // TODO: Import SettingsSecurityComponent when settings module is migrated
    console.warn('modalUserChangePass: SettingsSecurityComponent not yet migrated');
    return Promise.resolve(null);
  }

  async modalFlex(pTemplate: string): Promise<unknown> {
    if (this._flexDialogRef) {
      try { this._flexDialogRef.close(); } catch { /* ignore */ }
    }
    // TODO: Import FlexComponent when configuration-forms module is migrated
    console.warn('modalFlex: FlexComponent not yet migrated');
    return Promise.resolve(null);
  }

  async fieldModalFlex(pTemplate: string, pTipo?: string): Promise<unknown> {
    if (this._fieldDialogRef) {
      try { this._fieldDialogRef.close(); } catch { /* ignore */ }
    }
    // TODO: Import FieldComponent when configuration-forms module is migrated
    console.warn('fieldModalFlex: FieldComponent not yet migrated');
    return Promise.resolve(null);
  }

  async fieldEditModalFlex(pTemplate: string): Promise<unknown> {
    // TODO: Import AddFieldComponent when configuration-forms module is migrated
    console.warn('fieldEditModalFlex: AddFieldComponent not yet migrated');
    return Promise.resolve(null);
  }

  async fieldAddModalFlex(
    ptemplate: string,
    pCampo?: DocumentoPlantillaCaracteristicaDTO,
  ): Promise<unknown> {
    // TODO: Import AddFieldComponent when configuration-forms module is migrated
    console.warn('fieldAddModalFlex: AddFieldComponent not yet migrated');
    return Promise.resolve(null);
  }

  async propertyAddModalFlex(
    pCampo: string,
    ptipo: PropiedadValorDefinidoDTO,
    pPropiedad?: PropiedadCampoDTO,
  ): Promise<unknown> {
    // TODO: Import AddPropertyComponent when configuration-forms module is migrated
    console.warn('propertyAddModalFlex: AddPropertyComponent not yet migrated');
    return Promise.resolve(null);
  }

  async openPDF(): Promise<unknown> {
    // TODO: Import VisorPdfDialogComponent when PDF module is migrated
    console.warn('openPDF: VisorPdfDialogComponent not yet migrated');
    return Promise.resolve(null);
  }
}
