<script></script>
<style type="text/css">
  @media screen and (min-width: 640px) {
    li img {
      float: right;
      margin-left: 6em;
    }
  }
  img {
    border: 1px solid #333;
    margin-bottom: 1em;
  }
  ol {
    list-style: none;
    counter-reset: howto-steps-musicxml;
    padding: 0;
  }
  li {
    counter-increment: howto-steps-musicxml;
    margin: 0.25rem;
    clear: both;
    padding-bottom: 3em;
  }
  li::before {
    content: counter(howto-steps-musicxml);
    float: left;
    width: 2rem;
    height: 3rem;
    font-size: 2rem;
    display: inline-block;
    line-height: 3rem;
    text-align: left;
    margin-right: 0.5rem;
  }
</style>
<div>
  <h1>Hvordan lagre filer som MusicXML?</h1>
  <p>
    Her viser vi hvordan du kan opprette filer med
    <a href="https://musescore.org/">Musescore</a>. De fleste programmer for å
    skrive noter vil ha tilsvarende funksjonalitet.
  </p>
  <ol>
    <li>
      <img
        src="/images/howto/project-properties.png"
        alt="Skjermbilde av dialogen for prosjektegenskaper"
      />
      <b>Sett tittel</b>: Det er lurt å gi notene en tittel før du eksporterer.
      Gå til <em>Fil &gt; Egenskaper for prosjekt</em> og legg til en tittel.
      Klikk OK.
    </li>
    <li>
      <img
        src="/images/howto/musescore-export-dialog-1.png"
        alt="Skjermbilde av venstre side av eksport-dialogen i Musescore med innstillinger stemmer å eksportere"
      />
      <b>Eksporter</b>: Gå til <em>Fil &gt; Eksporter</em>. Kryss
      <em>bare</em> av for partitur (å eksportere alle stemmer er ikke
      nødvendig).
    </li>
    <li>
      <img
        src="/images/howto/musescore-export-dialog-2.png"
        alt="Skjermbilde av høyre side av eksport-dialogen i Musescore med innstillinger for MusicXML"
      />
      <b>Filtype</b>: i eksport-dialogen må du også velge
      <em>Format: MusicXML</em> og <em>Filtype: ukomprimert</em>.
    </li>
    <li>
      Klikk <em>Eksporter</em>. Legg fila et sted du finner den igjen, og last
      den opp her.
    </li>
  </ol>
</div>
