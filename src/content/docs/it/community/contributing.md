---
title: Contribuire
description: Come è governato Magma e come partecipare - i ruoli, i modi per entrare, i tipi di contributo, il percorso da una proposta a un rilascio, e le regole che ogni modifica segue.
---

Magma è nato con una o due persone che lo scrivevano tutto. Sta passando a un modello di
community, come funziona un progetto open source: chi usa Magma può cambiarlo. Un core team
modera il lavoro: decide cosa entra, verifica il design, revisiona il codice e pubblica i
rilasci. Tutto avviene in modo aperto, nel
[repository di Magma](https://github.com/magma-design-system/magma) su GitHub.

## Ruoli

- **Il core team** mantiene Magma: smista le proposte, valida i design, revisiona e unisce il
  codice, pubblica i rilasci. Il suo compito è anche aiutare chi contribuisce: a chi propone
  un contributo affianca una persona che fa da mentore, e aiuta a evitare le insidie di un
  codice grande e condiviso.
- **Chi contribuisce** è chiunque proponga una modifica: designer, sviluppatori e
  sviluppatrici, team di prodotto, chi scrive. Contribuire non vuol dire scrivere codice: una
  segnalazione di bug chiara, o una correzione a una pagina di questo sito, è un contributo
  anche quella.
- **I team di prodotto** usano Magma nei loro prodotti. Quando un problema emerge in un
  prodotto, la sua issue dice da quale prodotto viene, così il team sa quando è risolto.
- **Gli agenti IA** seguono le stesse regole delle persone: possono aprire issue, branch e
  pull request, e non fanno mai il merge.

## Come entrare

Ogni contributo parte da una issue nel repository di Magma, aperta con il template adatto a
quello che vuoi fare:

- **[Segnalazione di bug](https://github.com/magma-design-system/magma/issues/new?template=1-bug-report.yml)**:
  qualcosa non funziona.
- **[Richiesta di funzionalità](https://github.com/magma-design-system/magma/issues/new?template=2-feature-request.yml)**:
  un'idea da far valutare al core team, senza costruirla tu.
- **[Proposta di contributo](https://github.com/magma-design-system/magma/issues/new?template=3-contribution-proposal.yml)**:
  vuoi costruirla tu, nel codice o nel design; il core team ti affianca una persona che fa
  da mentore.
- **[Documentazione](https://github.com/magma-design-system/magma/issues/new?template=4-documentation.yml)**:
  qualcosa di sbagliato, superato o mancante nella documentazione.
- **[Formazione](https://github.com/magma-design-system/magma/issues/new?template=5-training-request.yml)**:
  formazione o onboarding per una persona, un team o un gruppo più ampio.

Cerca prima tra le [issue aperte](https://github.com/magma-design-system/magma/issues): lo
stesso lavoro potrebbe essere già in programma. Le domande su come usare Magma vanno su
[Stack Overflow](https://stackoverflowteams.com/c/magma-design-system/questions), non nelle
issue, e le vulnerabilità di sicurezza si segnalano
[in privato](https://github.com/magma-design-system/magma/security/advisories/new).

## Tipi di contributo

Il tipo di un contributo decide quali passi attraversa, e con che tipo di rilascio finisce.
Scegli il più piccolo che descrive la tua modifica: il core team lo conferma, o lo cambia, al
momento dello smistamento.

- **Correzione di bug**: qualcosa che non si comporta come dovrebbe. Niente design; una
  patch.
- **Piccolo miglioramento**: una piccola aggiunta che non tocca come è costruito un
  componente, come un colore in più per un'etichetta. Una patch o una minor.
- **Grande miglioramento**: una modifica più profonda a un componente, come rivedere i suoi
  slot. Con un design; una minor.
- **Nuova funzionalità**: un nuovo componente o una nuova capacità. Con un design; una minor.
- **Funzionalità su più componenti**: una modifica a come sono costruiti più componenti,
  come un attributo che condividono tutti. Con un design; una minor o una major.
- **Iniziativa maggiore**: una modifica al design system stesso, come ridisegnare tutti i
  componenti o rivedere i token. Con un design; una major.

## Da una proposta a un rilascio

Il core team interviene in tre punti di controllo: smistamento, validazione del design, e
revisione e merge.

1. **Proponi.** Apri la issue: cosa, perché, per chi, entro quando.
2. **Smistamento.** Il core team accetta la proposta e ne conferma il tipo, chiede altre
   informazioni, o la respinge con una motivazione.
3. **Design**, quando il tipo lo richiede: in Figma, partendo dalle librerie di Magma, con i
   token e l'accessibilità verificati.
4. **Validazione del design.** Il core team approva il design prima che si scriva codice, o
   chiede modifiche.
5. **Codice**, su un branch creato dalla issue, a partire da `dev`: un test per ogni modifica
   di comportamento, una storia in Storybook per ciò che cambia nell'aspetto, nell'interazione
   o nell'accessibilità.
6. **Pull request** verso `dev`, che chiude la sua issue, con tutti i controlli verdi.
7. **Revisione e merge.** Un maintainer revisiona la modifica, con la profondità che il suo
   rischio richiede, e la unisce.
8. **Documentazione.** La documentazione di un componente vive con lui nel repository di
   Magma, e questo sito la legge da lì; le linee guida come i [Fondamenti](../../foundation/)
   vivono nel repository di questo sito.
9. **Rilascio.** I maintainer promuovono `dev` in `main`; ogni pacchetto prende la versione
   che i suoi commit richiedono, e viene pubblicato su npm con le sue note di rilascio.

## Revisione per rischio

Ogni pull request riceve un livello di revisione, calcolato da ciò che cambia, non dichiarato:

- **Contratto**: cambia l'API pubblica dei componenti. Ogni membro cambiato deve essere
  voluto, e il rilascio deve dirlo.
- **Comportamento**: cambia il codice distribuito. I test devono descrivere il nuovo
  comportamento, e fallire con quello vecchio.
- **Visivo**: cambiano solo CSS, token, stili, icone o asset del brand. Chi revisiona guarda
  il risultato, non il CSS.
- **Basso**: solo documentazione, test o strumenti. Bastano i controlli verdi.

Tieni una pull request su un solo livello quando puoi: due revisioni rapide sono meglio di
una lunga.

## Le regole

- Ogni modifica parte da una issue, e il suo branch è collegato a essa.
- Nessuno fa push su `dev` o `main`: ogni modifica passa da una pull request.
- Il merge in `dev` e in `main` è una decisione di un maintainer, mai automatica.
- Niente viene unito con un controllo rosso, per quanto piccola sia la modifica.
- Una modifica di comportamento arriva con il test che la copre.
- Una modifica che rompe la compatibilità si dichiara, ed esce solo in una major: vedi
  [Versioni e migrazioni](../../development/versions/).
- I commit seguono il formato Conventional Commits, con uno scope: le versioni e le note di
  rilascio si calcolano da loro.

Le decisioni della sezione Fondamenti cambiano allo stesso modo, da una issue di
documentazione: vedi [Cambiare una decisione](../../foundation/principles/#cambiare-una-decisione).

## Approfondimenti

- [Wiki per chi contribuisce](https://github.com/magma-design-system/magma/wiki): ogni passo
  del flusso, una pagina per tipo di contributo, le etichette.
- [Contribution workflow and git governance](https://github.com/magma-design-system/magma/blob/dev/docs/WORKFLOW.md)
  e [commit message convention](https://github.com/magma-design-system/magma/blob/dev/docs/COMMITS.md),
  nel repository di Magma (in inglese).
- [Codice di condotta](../code-of-conduct/).
- Nathan Curtis, EightShapes:
  [Why Design System Contributions Matter](https://medium.com/eightshapes-llc/why-contributions-matter-22652d8676c6),
  [Defining Design System Contribution](https://medium.com/eightshapes-llc/defining-design-system-contributions-eb48e00e8898),
  [Design System Subtasks, by Step](https://medium.com/eightshapes-llc/design-system-subtasks-by-step-2f43d7d4bce0).
