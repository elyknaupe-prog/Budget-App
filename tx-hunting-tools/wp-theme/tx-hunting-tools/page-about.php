<?php
/**
 * Template Name: About
 *
 * Themed About page. Renders the page's editor content inside the site's
 * dark/brass wrapper. Applies automatically to a page with slug "about",
 * and is selectable on any page via Page Attributes → Template.
 */

get_header();
?>

<div class="page-body">
	<div class="wrap">
		<?php
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class(); ?>>
				<p class="kicker"><?php esc_html_e( 'About', 'txht' ); ?></p>
				<h1><?php the_title(); ?></h1>
				<div class="entry-content"><?php the_content(); ?></div>
			</article>
		<?php endwhile; ?>
	</div>
</div>

<?php
get_footer();
