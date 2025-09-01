'use server';
// Este arquivo está sendo preterido. A inicialização do admin será feita
// diretamente no arquivo de actions para garantir a inicialização correta.
// Manter o arquivo evita erros de importação em outros locais, mas ele não será mais o responsável pela inicialização.

import * as admin from 'firebase-admin';

export const adminAuth = admin.auth;
export const adminDb = admin.firestore;
