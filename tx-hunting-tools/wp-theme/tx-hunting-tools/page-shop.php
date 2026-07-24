<?php
/**
 * Template Name: Shop — Full Store
 *
 * Dedicated storefront page. Wraps the embedded Ecwid store in the site's
 * dark/brass theme so it reads as part of the site instead of Ecwid's
 * default green storefront.
 *
 * Applies automatically to a page with the slug "shop", and is also
 * selectable on any page via Page Attributes → Template.
 *
 * NOTE: the storefront's own background/tile colors come from Ecwid, not
 * this page. Set them in Ecwid admin → Design (dark scheme, accent
 * #C9A876) — that's what turns the bright-green category grid dark.
 */

get_header();
?>

<section class="shop-page">
	<div class="wrap">
		<p class="kicker"><?php echo esc_html( txht_opt( 'txht_shoppage_kicker' ) ); ?></p>
		<h1><?php echo esc_html( txht_opt( 'txht_shoppage_heading' ) ); ?></h1>
		<p class="section-lede"><?php echo esc_html( txht_opt( 'txht_shoppage_tagline' ) ); ?></p>

		<div class="shop-note">
			<strong><?php echo esc_html( txht_opt( 'txht_shop_note_label' ) ); ?></strong>
			<span><?php echo esc_html( txht_opt( 'txht_shop_note_text' ) ); ?></span>
		</div>

		<?php
		// Optional editor content shows above the store (leave the page body
		// empty to skip it).
		while ( have_posts() ) :
			the_post();
			if ( trim( get_the_content() ) ) :
				?>
				<div class="entry-content"><?php the_content(); ?></div>
				<?php
			endif;
		endwhile;
		?>

		<div class="ecwid-shell">
			<?php txht_render_store(); ?>
		</div>
	</div>
</section>

<?php
get_footer();
