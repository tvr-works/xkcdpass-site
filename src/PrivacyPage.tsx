import { SiteFrame } from '@/components/site-frame';

export function PrivacyPage() {
  return (
    <SiteFrame privacy>
      <article className="privacy-notice" aria-labelledby="privacy-title">
        <header>
          <h1 id="privacy-title">xkcdpass privacy</h1>
          <p className="privacy-date">
            Last updated <time dateTime="2026-11-24">November 24, 2026</time>
          </p>
        </header>
        <div className="typeset typeset-privacy">
          <p>
            TVR Works LLC operates xkcdpass.tvr.works. This notice covers visits to that website and
            use of the xkcdpass command-line tool.
          </p>

          <section aria-labelledby="website-visits">
            <h2 id="website-visits">Website visits</h2>
            <p>
              Cloudflare helps deliver and protect this site. It processes information about
              requests, such as your IP address and the pages you request. Your browser may send
              Cloudflare a report if it has trouble connecting to the site. See{' '}
              <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare’s privacy policy</a>.
            </p>
            <p>
              You can read the site without signing in. We don’t add advertising or visitor
              analytics scripts to the site.
            </p>
          </section>

          <section aria-labelledby="passphrases-and-demo">
            <h2 id="passphrases-and-demo">Passphrases and the browser demo</h2>
            <p>
              The command-line tool generates and prints passphrases on your device using a word
              list included in the program. It does not send them to the website.
            </p>
            <p>
              The entropy explorer calculates examples in your browser from the word count you
              choose. The website has no field for entering a passphrase. Use the installed command
              to generate your own passphrases.
            </p>
          </section>

          <section aria-labelledby="support-and-privacy">
            <h2 id="support-and-privacy">Support and privacy questions</h2>
            <p>
              If you email us, we receive your email address, message and any attachments. We use
              what you send to respond and follow up. If you post a public GitHub issue, other
              people can read it.
            </p>
            <p>
              For privacy questions, or to ask about or request deletion of information you sent us,
              email{' '}
              {/* Keep the public contact readable with JavaScript disabled on Cloudflare Pages. */}
              <span
                dangerouslySetInnerHTML={{
                  __html:
                    '<!--email_off--><a href="mailto:support@tvr.works">support@tvr.works</a><!--/email_off-->',
                }}
              />
              .
            </p>
          </section>
        </div>
      </article>
    </SiteFrame>
  );
}
