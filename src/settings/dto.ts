export type UpdateStoreSettingDto = Partial<{
  name: string
  address: string
  phone: string
  extra: unknown
}>

export type CreateBankAccountDto = {
  bankName: string
  accountNumber: string
  accountHolder: string
  isActive?: boolean
  sortOrder?: number
}

export type UpdateBankAccountDto = Partial<CreateBankAccountDto>


// Pet Species
export type CreatePetSpeciesDto = {
  kind: string
  name: string
  isActive?: boolean
  sortOrder?: number
}

export type UpdatePetSpeciesDto = Partial<CreatePetSpeciesDto>

