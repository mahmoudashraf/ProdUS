import type { Dispatch, SetStateAction } from 'react';
import type {
  ExternalImportForm,
  HostedScanForm,
  ProviderSourceForm,
  ScannerScheduleForm,
  ScannerUploadForm,
  ScanSourceForm,
} from './scannerProofOperationsTypes';
import type {
  CiTemplateResponse,
  ProductProfile,
  ProjectWorkspace,
  ScannerConnectorInstallation,
} from './types';

export interface OwnerWorkspaceScannerMutationsInput {
  activeProviderInstallations: ScannerConnectorInstallation[];
  ciTemplateType: CiTemplateResponse['type'];
  deleteArtifactsOnDisconnect: boolean;
  externalImportForm: ExternalImportForm;
  hostedScanForm: HostedScanForm;
  providerSourceForm: ProviderSourceForm;
  scheduleForm: ScannerScheduleForm;
  scannerUploadForm: ScannerUploadForm;
  scanSourceForm: ScanSourceForm;
  selectedProduct: ProductProfile | undefined;
  selectedWorkspace: ProjectWorkspace | undefined;
  setCartNotice: (notice: string) => void;
  setCiTemplate: Dispatch<SetStateAction<CiTemplateResponse | null>>;
  setDeleteArtifactsOnDisconnect: Dispatch<SetStateAction<boolean>>;
  setExternalImportForm: Dispatch<SetStateAction<ExternalImportForm>>;
  setHostedScanForm: Dispatch<SetStateAction<HostedScanForm>>;
  setProviderSourceForm: Dispatch<SetStateAction<ProviderSourceForm>>;
  setScannerUploadForm: Dispatch<SetStateAction<ScannerUploadForm>>;
  setScanSourceForm: Dispatch<SetStateAction<ScanSourceForm>>;
}
