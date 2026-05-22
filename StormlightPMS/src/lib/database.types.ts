// PLACEHOLDER — overwritten by `supabase gen types typescript`.
// Until generation is wired up, we use a permissive shape so the typed client
// does not collapse Insert/Update args to `never`.
//
// Do not hand-edit once generation is wired up.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AnyRow = Record<string, any>;

interface AnyTable {
  Row: AnyRow;
  Insert: AnyRow;
  Update: AnyRow;
  Relationships: any[];
}

interface AnyFunction {
  Args: AnyRow;
  Returns: any;
}

export interface Database {
  public: {
    Tables: { [name: string]: AnyTable };
    Views: { [name: string]: { Row: AnyRow } };
    Functions: { [name: string]: AnyFunction };
    Enums: { [name: string]: string };
    CompositeTypes: { [name: string]: AnyRow };
  };
}
