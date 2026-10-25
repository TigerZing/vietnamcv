from app.modules.news.service import place_figures


def test_placeholders_follow_the_figures_that_are_shown() -> None:
    body = "A\n\n{{figure:1}}\n\nB\n\n{{figure:3}}\n\nC {{figure:2}}"
    # Figure 2 (position 1) is hidden: figure 3 becomes the second one returned.
    assert place_figures(body, [0, 2]) == "A\n\n{{figure:1}}\n\nB\n\n{{figure:2}}\n\nC {{figure:2}}"
    assert place_figures(body, [2]) == "A\n\n\n\nB\n\n{{figure:1}}\n\nC {{figure:2}}"
    assert place_figures(body, []) == "A\n\n\n\nB\n\n\n\nC {{figure:2}}"
