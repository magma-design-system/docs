---
title: Principi
description: I quattro principi dietro ogni decisione di Magma - inclusivo, abilitante, intuitivo, flessibile - cosa chiede ciascuno in pratica, e quale vince quando non vanno d'accordo.
---

I prodotti Maggioli sono usati da chi lavora nella pubblica amministrazione e con la pubblica
amministrazione: uffici comunali, polizia locale, uffici tecnici, e i professionisti che ci
hanno a che fare ogni giorno. Lavorano tra norme e scadenze, spesso per ore di fila, sul
computer che il loro ufficio mette a disposizione. Magma è progettato per loro, intorno a
quattro principi.

Ogni pagina di questa sezione è un ambito di decisioni prese da questi principi: non ci sono
principi del colore, della tipografia o delle icone, solo decisioni che dicono quale
principio servono.

## Inclusivo

Nessuno sceglie un servizio pubblico. Chi lavora allo sportello usa il software che il comune
ha comprato, chi si rivolge al comune usa il servizio che offre: se il prodotto non funziona
per loro, non hanno alternative. Per questo deve funzionare per tutte le persone che devono
usarlo.

- Progettato per le WCAG 2.x AA, e per le preferenze che le persone impostano: modalità
  scura, più contrasto, meno movimento, consumi ridotti.
- Leggero per il dispositivo e per la rete: gli uffici tengono i computer per anni, e non
  tutte le connessioni sono veloci.
- Le parole di chi usa il prodotto, non quelle della norma o del codice.

Approfondisci in [Accessibilità](../accessibility/) e [Linguaggio inclusivo](../inclusive-language/).

## Abilitante

Il lavoro fatto con questi prodotti ha conseguenze: una scadenza rispettata, un pagamento
eseguito, un atto depositato. Le persone devono poterlo portare a termine, e sapere di averlo
fatto bene.

- Il compito più frequente viene per primo; gli altri restano a un passo, non nascosti.
- Le procedure lunghe sono divise in passi, e ognuno chiede solo quello che gli serve.
- Il lavoro ripetitivo è automatizzato, o si fa su molti elementi insieme.
- Attrito solo dove protegge: una conferma prima di ciò che non si può annullare, mai prima
  di ciò che si può annullare.
- Un errore dice cosa è successo e cosa fare dopo. Rimediare costa meno che sbagliare.
- Il prodotto suggerisce, la persona decide. Ciò che produce un'intelligenza artificiale è
  sempre segnalato come tale, con `mds-policy-ai`, perché chi lo usa sappia cosa controllare.

## Intuitivo

La maggior parte delle persone usa più di un prodotto Maggioli, molte ogni giorno e per anni.
Quello che hanno imparato in uno deve funzionare nel successivo.

- Lo stesso problema ha la stessa soluzione in ogni prodotto: un pattern si usa per lo stesso
  motivo e nello stesso modo, altrimenti non è un pattern.
- Le convenzioni del web e della piattaforma vengono prima delle invenzioni: un'interazione
  nuova va imparata, una standard è già nota.
- Un concetto, un nome, un'icona.
- Ogni elemento di una schermata si guadagna il posto aiutando il compito; il resto va via.

## Flessibile

Magma serve un gruppo di aziende, marchi e prodotti, alcuni nuovi, altri nati molto prima di
Magma. Deve adattarsi a tutti senza dividersi in un design system per ciascuno.

- Un marchio cambia Magma con i token e i temi, mai creando la propria copia di un
  componente.
- Il marchio si fa avanti nelle pagine editoriali e promozionali, e si fa da parte negli
  strumenti in cui si lavora.
- L'adozione è graduale: un prodotto esistente può partire dai token e passare ai componenti
  una schermata alla volta.
- I componenti sono web component, quindi funzionano nel framework che un prodotto ha già.

## Quando non vanno d'accordo

I principi tirano in direzioni diverse: il colore del marchio che non è abbastanza leggibile
come testo, la scorciatoia che solo alcune persone riescono a usare, il pattern noto che non
si adatta a un compito nuovo. Quando succede, vincono nel loro ordine:

1. **Inclusivo**: una scelta che lascia fuori qualcuno non è accettabile, per quanto sia
   rapida, familiare o fedele al marchio.
2. **Abilitante**: poi, ciò che permette alle persone di finire il loro lavoro.
3. **Intuitivo**: poi, ciò che già conoscono.
4. **Flessibile**: poi, ciò che si adatta al marchio e al prodotto.

## Cambiare una decisione

Le decisioni di questa sezione cambiano come cambia il codice: qualcuno propone, la community
discute, il core team revisiona. Una proposta dice quale principio serve e quale decisione
sostituisce. Aprila con la
[issue di documentazione](https://github.com/magma-design-system/magma/issues/new?template=4-documentation.yml)
del repository di Magma.
