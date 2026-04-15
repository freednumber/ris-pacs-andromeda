const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // ─── USERS ───────────────────────────────────────────────────────────────

    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pacsris.it' },
        update: {},
        create: {
            email: 'admin@pacsris.it',
            password: adminPassword,
            nome: 'Admin',
            cognome: 'Sistema',
            ruolo: 'ADMIN',
        },
    });

    const drPassword = await bcrypt.hash('medico123', 12);
    const medico = await prisma.user.upsert({
        where: { email: 'dott.bianchi@ospedale.it' },
        update: {},
        create: {
            email: 'dott.bianchi@ospedale.it',
            password: drPassword,
            nome: 'Marco',
            cognome: 'Bianchi',
            ruolo: 'MEDICO',
            specializzazione: 'Radiologia',
            struttura: 'Ospedale San Giovanni, Roma',
        },
    });

    // Paziente con account di login sul portale
    const pazientePassword = await bcrypt.hash('paziente123', 12);
    const pazienteUser = await prisma.user.upsert({
        where: { email: 'mario.rossi@email.it' },
        update: {},
        create: {
            email: 'mario.rossi@email.it',
            password: pazientePassword,
            nome: 'Mario',
            cognome: 'Rossi',
            ruolo: 'PAZIENTE',
            telefono: '+39 333 1234567',
        },
    });

    // ─── PATIENTS ────────────────────────────────────────────────────────────

    const paziente1 = await prisma.patient.upsert({
        where: { codiceFiscale: 'RSSMRA80A01H501X' },
        update: {},
        create: {
            codiceFiscale: 'RSSMRA80A01H501X',
            nome: 'Mario',
            cognome: 'Rossi',
            dataNascita: new Date('1980-01-01'),
            sesso: 'M',
            luogoNascita: 'Roma',
            indirizzo: 'Via Roma 12',
            citta: 'Roma',
            cap: '00100',
            provincia: 'RM',
            telefono: '+39 333 1234567',
            email: 'mario.rossi@email.it',
        },
    });

    const paziente2 = await prisma.patient.upsert({
        where: { codiceFiscale: 'VRDGPP75B02F205Y' },
        update: {},
        create: {
            codiceFiscale: 'VRDGPP75B02F205Y',
            nome: 'Giuseppina',
            cognome: 'Verdi',
            dataNascita: new Date('1975-02-15'),
            sesso: 'F',
            citta: 'Milano',
            provincia: 'MI',
            telefono: '+39 320 9876543',
        },
    });

    const paziente3 = await prisma.patient.upsert({
        where: { codiceFiscale: 'BNCLCA90C03L219Z' },
        update: {},
        create: {
            codiceFiscale: 'BNCLCA90C03L219Z',
            nome: 'Luca',
            cognome: 'Bianchi',
            dataNascita: new Date('1990-03-10'),
            sesso: 'M',
            citta: 'Torino',
            provincia: 'TO',
        },
    });

    // ─── STUDIES (existing) ───────────────────────────────────────────────────

    await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RX Torace in 2 proiezioni',
            modalita: 'CR',
            bodyPart: 'TORACE',
            sedeEsame: 'Ospedale San Giovanni, Roma',
            stato: 'REFERTATO',
            referto: 'Non si evidenziano lesioni pleuroparenchimali in atto. Cuore nei limiti. Seni costofrenici liberi.',
            medicoRefertanteId: medico.id,
            dataReferto: new Date(),
        },
    });

    await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'TC Encefalo senza mdc',
            modalita: 'CT',
            bodyPart: 'TESTA',
            sedeEsame: 'Ospedale San Giovanni, Roma',
            stato: 'COMPLETATO',
            priorita: 'URGENTE',
        },
    });

    await prisma.study.create({
        data: {
            patientId: paziente2.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RM Ginocchio sx',
            modalita: 'MR',
            bodyPart: 'GINOCCHIO',
            sedeEsame: 'Clinica Villa Rosa, Milano',
            stato: 'IN_CORSO',
        },
    });

    await prisma.study.create({
        data: {
            patientId: paziente3.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'Ecografia addome completo',
            modalita: 'US',
            bodyPart: 'ADDOME',
            sedeEsame: 'Studio Medico Dr. Bianchi, Torino',
            stato: 'COMPLETATO',
        },
    });

    // ─── STUDIES FOR PATIENT PORTAL (Mario Rossi) ────────────────────────────
    // Questi 3 studi simulano il portale paziente con viewer PACS mock

    const studioPaziente_RMCranio = await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            medicoRefertanteId: medico.id,
            descrizione: 'RM Encefalo senza e con mdc',
            modalita: 'MR',
            bodyPart: 'CRANIO',
            sedeEsame: 'Centro RM Parioli – Viale Parioli 55, Roma',
            stato: 'REFERTATO',
            priorita: 'NORMALE',
            dataStudio: new Date('2026-03-10T09:30:00'),
            referto: `ESAME: RM Encefalo senza e con mdc
DATA: 10/03/2026
MEDICO REFERTANTE: Dott. Marco Bianchi

TECNICA: Studio RM dell'encefalo eseguito con apparecchiatura a 1.5T con sequenze standard SE T1, TSE T2, FLAIR, DWI e sequenze T1 post-contrasto (gadolinio 0.1 mmol/kg).

REPERTI:
Il parenchima cerebrale presenta normale morfologia e segnale nelle sequenze eseguite. Non si evidenziano aree di alterato segnale nelle sequenze T2/FLAIR riferibili a lesioni ischemiche o demielinizzanti in atto. Non si rilevano aree di restrizione alla diffusione. Il sistema ventricolare è nei limiti dimensionali, simmetrico, regolarmente conformato. Le strutture della linea mediana sono in sede. Le cisterne della base sono libere e pervie. Non si evidenziano alterazioni patologiche del segnale a carico della fossa posteriore. Lo studio post-contrasto non dimostra anomale impregnazioni patologiche. La sella turcica è nei limiti, l'ipofisi ha normale morfologia e segnale.

CONCLUSIONI:
RM encefalo nei limiti della norma. Non si rilevano lesioni focali né alterazioni del segnale patologicamente significative.`,
            dataReferto: new Date('2026-03-10T14:00:00'),
        },
    });

    const studioPaziente_TCAddome = await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            medicoRefertanteId: medico.id,
            descrizione: 'TC Addome e Pelvi con mdc',
            modalita: 'CT',
            bodyPart: 'ADDOME',
            sedeEsame: 'Clinica Villa Serena – Via Aurelia 300, Roma',
            stato: 'REFERTATO',
            priorita: 'NORMALE',
            dataStudio: new Date('2026-03-15T11:00:00'),
            referto: `ESAME: TC Addome e Pelvi con mdc e.v.
DATA: 15/03/2026
MEDICO REFERTANTE: Dott. Marco Bianchi

TECNICA: Studio TC dell'addome e della pelvi eseguito con mezzo di contrasto iodato e.v. nelle fasi arteriosa, portale e tardiva (MDCT 64 strati, collimazione 0.6 mm).

REPERTI:
FEGATO: Dimensioni nella norma, profilo regolare, parenchima omogeneo. Non si evidenziano lesioni focali nelle sequenze eseguite.
COLECISTI: Regolarmente distesa, pareti nei limiti, assenza di calcoli endoluminali.
VIE BILIARI: Non dilatate.
MILZA: Dimensioni nella norma, omogenea.
PANCREAS: Regolare per morfologia e densità, wirsung non dilatato.
SURRENI: Bilateralmente nella norma.
RENI: Entrambi i reni sono regolari per morfologia e dimensioni. Escrezione del mdc simmetrica e tempestiva. Non si identificano calcoli o masse.
AORTA E VASI: Calibro regolare, pareti nei limiti.
INTESTINO: Anse intestinali nei limiti, nessuna occlusione evidenziabile.
PELVI: Non si identificano masse o linfoadenopatie significative.

CONCLUSIONI:
TC addome e pelvi senza reperti patologici di rilievo.`,
            dataReferto: new Date('2026-03-15T16:30:00'),
        },
    });

    // Studio futuro (schedulato) – nessun referto ancora
    await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RX Torace PA e LL',
            modalita: 'CR',
            bodyPart: 'TORACE',
            sedeEsame: 'Centro Diagnostico Roma Nord – Via Salaria 120, Roma',
            stato: 'IN_CORSO',
            priorita: 'NORMALE',
            dataStudio: new Date('2026-04-28T10:00:00'),
        },
    });

    // ─── PRENOTAZIONI (Patient Portal) ───────────────────────────────────────
    // Verifica se il modello Prenotazione esiste prima di inserire

    const hasPrenotazione = Object.keys(prisma).includes('prenotazione');

    if (hasPrenotazione) {
        // Prenotazione confermata – RM Cranio
        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-001' },
            update: {},
            create: {
                id: 'seed-prenotazione-001',
                pazienteId: paziente1.id,
                tipoEsame: 'RM',
                descrizioneEsame: 'RM Encefalo con e senza mdc',
                struttura: 'Centro RM Parioli – Viale Parioli 55, Roma',
                dataDesiderata: new Date('2026-04-20T09:00:00'),
                stato: 'CONFERMATO',
                note: 'Paziente riferisce cefalea ricorrente da 3 mesi.',
                codicePrenotazione: 'AND-2026-001',
            },
        });

        // Prenotazione in attesa – RX Torace
        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-002' },
            update: {},
            create: {
                id: 'seed-prenotazione-002',
                pazienteId: paziente1.id,
                tipoEsame: 'RX',
                descrizioneEsame: 'RX Torace PA e LL',
                struttura: 'Centro Diagnostico Roma Nord – Via Salaria 120, Roma',
                dataDesiderata: new Date('2026-04-28T10:00:00'),
                stato: 'IN_ATTESA',
                note: null,
                codicePrenotazione: 'AND-2026-002',
            },
        });

        // Prenotazione completata – TC Addome
        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-003' },
            update: {},
            create: {
                id: 'seed-prenotazione-003',
                pazienteId: paziente1.id,
                tipoEsame: 'TC',
                descrizioneEsame: 'TC Addome e Pelvi con mdc',
                struttura: 'Clinica Villa Serena – Via Aurelia 300, Roma',
                dataDesiderata: new Date('2026-03-15T11:00:00'),
                stato: 'COMPLETATO',
                studyId: studioPaziente_TCAddome.id,
                codicePrenotazione: 'AND-2026-003',
            },
        });

        // Prenotazione annullata – Ecografia
        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-004' },
            update: {},
            create: {
                id: 'seed-prenotazione-004',
                pazienteId: paziente1.id,
                tipoEsame: 'ECO',
                descrizioneEsame: 'Ecografia addome superiore',
                struttura: 'Poliambulatorio San Marco – Corso Vittorio 45, Milano',
                dataDesiderata: new Date('2026-04-05T15:00:00'),
                stato: 'ANNULLATO',
                note: 'Annullato dal paziente per impegni lavorativi.',
                codicePrenotazione: 'AND-2026-004',
            },
        });

        console.log('📅 Prenotazioni mock create con successo.');
    } else {
        console.log('⚠️  Modello Prenotazione non trovato nello schema. Esegui: npx prisma migrate dev --name add-prenotazioni');
    }

    console.log('✅ Seed completato!');
    console.log('\n📧 Credenziali di accesso:');
    console.log('   Admin:    admin@pacsris.it     / admin123');
    console.log('   Medico:   dott.bianchi@ospedale.it / medico123');
    console.log('   Paziente: mario.rossi@email.it  / paziente123');
    console.log('\n👥 Pazienti nel DB:', paziente1.cognome, '|', paziente2.cognome, '|', paziente3.cognome);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
