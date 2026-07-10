<?php
/**
 * FFL Info page — used automatically for a page with slug "ffl-info".
 * Carries the license plate and the transfer-process explanation required
 * by the compliance checklist. If the page has its own content in the
 * editor, that content is appended after the standing compliance copy.
 */

get_header();
?>

<div class="page-body">
	<div class="wrap">
		<article>
			<p class="kicker"><?php esc_html_e( 'Compliance', 'txht' ); ?></p>
			<h1><?php esc_html_e( 'FFL Information & Transfers', 'txht' ); ?></h1>

			<div class="entry-content">
				<div class="ffl-plate">
					<div class="label"><?php esc_html_e( 'Federal Firearms License — Type 07/02 (Manufacturer / SOT)', 'txht' ); ?></div>
					<?php echo esc_html( txht_opt( 'txht_ffl' ) ); ?><br>
					<?php echo esc_html( txht_opt( 'txht_address' ) ); ?>
				</div>

				<h2><?php esc_html_e( 'How regulated purchases work', 'txht' ); ?></h2>
				<p><?php esc_html_e( 'Suppressors and firearms purchased from us are never shipped directly to a customer. After checkout, fulfillment happens one of two ways:', 'txht' ); ?></p>
				<ul>
					<li><?php esc_html_e( 'In-store pickup at our League City shop, with all required paperwork and background-check steps completed on site.', 'txht' ); ?></li>
					<li><?php esc_html_e( 'Transfer to a licensed FFL dealer near you. Contact us after ordering and we will coordinate the transfer with your receiving dealer.', 'txht' ); ?></li>
				</ul>
				<p><?php esc_html_e( 'Suppressors are NFA items: expect the standard ATF Form 4 process, fingerprints, photograph, and the $200 tax stamp, plus ATF processing time before you take possession.', 'txht' ); ?></p>

				<h2><?php esc_html_e( 'Unregulated gear', 'txht' ); ?></h2>
				<p><?php esc_html_e( 'Optics, apparel, and field tools have none of these restrictions and ship directly through standard checkout.', 'txht' ); ?></p>

				<?php
				// Any additional editor content follows the standing copy.
				while ( have_posts() ) :
					the_post();
					the_content();
				endwhile;
				?>
			</div>
		</article>
	</div>
</div>

<?php
get_footer();
